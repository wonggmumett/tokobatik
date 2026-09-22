import { useEffect, useMemo, useState } from "react";
import {
  Archive,
  Check,
  ChevronDown,
  ChevronUp,
  Edit3,
  Eye,
  FileDown,
  Filter,
  Image as ImageIcon,
  LayoutDashboard,
  LogOut,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShoppingBag,
  Tag,
  Trash2,
  X,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";

/* =========================================================
   HELPERS
========================================================= */

const money = (n) =>
  new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(Number(n) || 0);

const dateOnly = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleDateString("id-ID", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
};

const dateTime = (value) => {
  if (!value) return "-";

  return new Date(value).toLocaleString("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  });
};

const emptyProductForm = {
  name: "",
  category_id: "",
  price: "",
  compare_price: "",
  description: "",
  sizes: "S,M,L,XL",
  colors: "",
  stock: "0",
  sku: "",
  image_url: "",
  is_active: true,
  is_featured: false,
};

const emptyCategoryForm = {
  name: "",
  slug: "",
  description: "",
};

const fallbackImage =
  "https://images.unsplash.com/photo-1610030469983-98e550d6193c?auto=format&fit=crop&w=600&q=80";

function slugify(value) {
  return value
    .toString()
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function startOfDay(date) {
  const value = new Date(date);
  value.setHours(0, 0, 0, 0);
  return value;
}

function endOfDay(date) {
  const value = new Date(date);
  value.setHours(23, 59, 59, 999);
  return value;
}

function getWeekStart(date) {
  const value = startOfDay(date);
  const day = value.getDay();
  const diff = day === 0 ? -6 : 1 - day;

  value.setDate(value.getDate() + diff);

  return value;
}

function getWeekEnd(date) {
  const start = getWeekStart(date);
  const end = new Date(start);

  end.setDate(end.getDate() + 6);

  return endOfDay(end);
}

/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function AdminDashboard() {
  const { profile, logout } = useAuth();

  /* =======================================================
     DATA
  ======================================================= */

  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  const [categories, setCategories] = useState([]);

  /* =======================================================
     GLOBAL UI
  ======================================================= */

  const [activeTab, setActiveTab] = useState("overview");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  /* =======================================================
     PRODUCT
  ======================================================= */

  const [productForm, setProductForm] =
    useState(emptyProductForm);

  const [editingProductId, setEditingProductId] =
    useState(null);

  const [productSearch, setProductSearch] =
    useState("");

  const [productCategory, setProductCategory] =
    useState("all");

  const [productStatus, setProductStatus] =
    useState("all");

  /* =======================================================
     CATEGORY
  ======================================================= */

  const [categoryForm, setCategoryForm] =
    useState(emptyCategoryForm);

  const [editingCategoryId, setEditingCategoryId] =
    useState(null);

  const [categorySearch, setCategorySearch] =
    useState("");

  /* =======================================================
     ORDERS
  ======================================================= */

  const [orderSearch, setOrderSearch] =
    useState("");

  const [orderFilter, setOrderFilter] =
    useState("all");

  const [expandedOrder, setExpandedOrder] =
    useState(null);

  const [orderItems, setOrderItems] = useState({});

  const [loadingOrderItems, setLoadingOrderItems] =
    useState(false);

  /* =======================================================
     REPORT
  ======================================================= */

  const [reportPeriod, setReportPeriod] =
    useState("thisMonth");

  const [customStart, setCustomStart] =
    useState("");

  const [customEnd, setCustomEnd] =
    useState("");

  /* =======================================================
     LOAD DATA
  ======================================================= */

  async function loadData() {
    setLoading(true);
    setError("");

    const [
      productsResult,
      ordersResult,
      categoriesResult,
    ] = await Promise.all([
      supabase
        .from("products")
        .select("*, categories(id,name,slug)")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("orders")
        .select("*")
        .order("created_at", {
          ascending: false,
        }),

      supabase
        .from("categories")
        .select("*")
        .order("name"),
    ]);

    const errors = [
      productsResult.error,
      ordersResult.error,
      categoriesResult.error,
    ].filter(Boolean);

    if (errors.length) {
      setError(errors[0].message);
    }

    setProducts(productsResult.data || []);
    setOrders(ordersResult.data || []);
    setCategories(categoriesResult.data || []);

    setLoading(false);
  }

  useEffect(() => {
    loadData();
  }, []);

  /* =======================================================
     PRODUCT FILTER
  ======================================================= */

  const filteredProducts = useMemo(() => {
    const search =
      productSearch.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch =
        !search ||
        product.name
          ?.toLowerCase()
          .includes(search) ||
        product.sku
          ?.toLowerCase()
          .includes(search) ||
        product.slug
          ?.toLowerCase()
          .includes(search);

      const matchesCategory =
        productCategory === "all" ||
        product.category_id === productCategory;

      const stock = Number(product.stock || 0);

      const matchesStatus =
        productStatus === "all" ||
        (productStatus === "active" &&
          product.is_active === true) ||
        (productStatus === "inactive" &&
          product.is_active !== true) ||
        (productStatus === "featured" &&
          product.is_featured === true) ||
        (productStatus === "out" && stock <= 0) ||
        (productStatus === "low" &&
          stock > 0 &&
          stock <= 5);

      return (
        matchesSearch &&
        matchesCategory &&
        matchesStatus
      );
    });
  }, [
    products,
    productSearch,
    productCategory,
    productStatus,
  ]);

  /* =======================================================
     CATEGORY FILTER
  ======================================================= */

  const filteredCategories = useMemo(() => {
    const search =
      categorySearch.trim().toLowerCase();

    return categories.filter((category) =>
      !search
        ? true
        : category.name
            ?.toLowerCase()
            .includes(search) ||
          category.slug
            ?.toLowerCase()
            .includes(search)
    );
  }, [categories, categorySearch]);

  /* =======================================================
     ORDER FILTER
  ======================================================= */

  const filteredOrders = useMemo(() => {
    const search =
      orderSearch.trim().toLowerCase();

    return orders.filter((order) => {
      const matchesSearch =
        !search ||
        order.customer_name
          ?.toLowerCase()
          .includes(search) ||
        order.phone
          ?.toLowerCase()
          .includes(search) ||
        order.customer_email
          ?.toLowerCase()
          .includes(search) ||
        order.id
          ?.toLowerCase()
          .includes(search);

      const matchesStatus =
        orderFilter === "all" ||
        order.status === orderFilter;

      return (
        matchesSearch &&
        matchesStatus
      );
    });
  }, [
    orders,
    orderSearch,
    orderFilter,
  ]);

  /* =======================================================
     STATISTICS
  ======================================================= */

  const statistics = useMemo(() => {
    const activeProducts =
      products.filter(
        (product) =>
          product.is_active === true
      ).length;

    const featuredProducts =
      products.filter(
        (product) =>
          product.is_featured === true
      ).length;

    const outOfStock =
      products.filter(
        (product) =>
          Number(product.stock || 0) <= 0
      ).length;

    const lowStock =
      products.filter((product) => {
        const stock = Number(
          product.stock || 0
        );

        return stock > 0 && stock <= 5;
      }).length;

    const pendingOrders =
      orders.filter(
        (order) =>
          order.status === "pending"
      ).length;

    const processingOrders =
      orders.filter(
        (order) =>
          order.status === "processing"
      ).length;

    const shippedOrders =
      orders.filter(
        (order) =>
          order.status === "shipped"
      ).length;

    const completedOrders =
      orders.filter(
        (order) =>
          order.status === "completed"
      ).length;

    const cancelledOrders =
      orders.filter(
        (order) =>
          order.status === "cancelled"
      ).length;

    const paidOrders =
      orders.filter(
        (order) =>
          order.payment_status === "paid"
      ).length;

    const sales = orders
      .filter(
        (order) =>
          order.status !== "cancelled"
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    const completedSales = orders
      .filter(
        (order) =>
          order.status === "completed"
      )
      .reduce(
        (sum, order) =>
          sum + Number(order.total || 0),
        0
      );

    return {
      totalProducts: products.length,
      activeProducts,
      featuredProducts,
      outOfStock,
      lowStock,
      totalOrders: orders.length,
      pendingOrders,
      processingOrders,
      shippedOrders,
      completedOrders,
      cancelledOrders,
      paidOrders,
      sales,
      completedSales,
    };
  }, [products, orders]);

  /* =======================================================
     PRODUCT FORM
  ======================================================= */

  function updateProductForm(
    field,
    value
  ) {
    setProductForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function editProduct(product) {
    setEditingProductId(product.id);

    setProductForm({
      name: product.name || "",
      category_id:
        product.category_id || "",
      price: product.price ?? "",
      compare_price:
        product.compare_price ?? "",
      description:
        product.description || "",
      sizes: Array.isArray(product.sizes)
        ? product.sizes.join(",")
        : "",
      colors: Array.isArray(product.colors)
        ? product.colors.join(",")
        : "",
      stock: product.stock ?? 0,
      sku: product.sku || "",
      image_url:
        product.image_url || "",
      is_active:
        product.is_active !== false,
      is_featured:
        product.is_featured === true,
    });

    setMessage("");
    setError("");
    setActiveTab("products");

    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  }

  function resetProductForm() {
    setEditingProductId(null);

    setProductForm({
      ...emptyProductForm,
    });
  }

  /* =======================================================
     SAVE PRODUCT
  ======================================================= */

  async function saveProduct(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!productForm.name.trim()) {
      setError(
        "Nama produk wajib diisi."
      );
      setSaving(false);
      return;
    }

    if (!productForm.category_id) {
      setError(
        "Pilih kategori produk."
      );
      setSaving(false);
      return;
    }

    const price = Number(
      productForm.price || 0
    );

    const stock = Math.max(
      0,
      Number(productForm.stock || 0)
    );

    if (price < 0) {
      setError(
        "Harga tidak boleh negatif."
      );
      setSaving(false);
      return;
    }

    const baseSlug = slugify(
      productForm.name
    );

    let slug = baseSlug;

    if (editingProductId) {
      const current = products.find(
        (item) =>
          item.id === editingProductId
      );

      slug =
        current?.name ===
        productForm.name
          ? current.slug
          : `${baseSlug}-${editingProductId.slice(
              0,
              6
            )}`;
    }

    const payload = {
      name: productForm.name.trim(),
      slug,
      category_id:
        productForm.category_id,
      description:
        productForm.description.trim() ||
        null,
      price,
      compare_price:
        productForm.compare_price === ""
          ? null
          : Number(
              productForm.compare_price
            ),
      stock,
      sku:
        productForm.sku.trim() ||
        null,
      image_url:
        productForm.image_url.trim() ||
        null,
      is_active:
        Boolean(productForm.is_active),
      is_featured:
        Boolean(
          productForm.is_featured
        ),
      sizes: productForm.sizes
        .split(",")
        .map((value) =>
          value.trim()
        )
        .filter(Boolean),
      colors: productForm.colors
        .split(",")
        .map((value) =>
          value.trim()
        )
        .filter(Boolean),
    };

    const result =
      editingProductId
        ? await supabase
            .from("products")
            .update(payload)
            .eq(
              "id",
              editingProductId
            )
        : await supabase
            .from("products")
            .insert(payload);

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(
        editingProductId
          ? "Produk berhasil diperbarui."
          : "Produk berhasil ditambahkan."
      );

      resetProductForm();

      await loadData();
    }

    setSaving(false);
  }

  /* =======================================================
     DELETE PRODUCT
  ======================================================= */

  async function deleteProduct(id) {
    const product = products.find(
      (item) => item.id === id
    );

    if (
      !window.confirm(
        `Hapus produk "${product?.name || ""}"?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    const { error: deleteError } =
      await supabase
        .from("products")
        .delete()
        .eq("id", id);

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    if (editingProductId === id) {
      resetProductForm();
    }

    setMessage(
      "Produk berhasil dihapus."
    );

    await loadData();
  }

  /* =======================================================
     TOGGLE PRODUCT
  ======================================================= */

  async function toggleProductActive(
    product
  ) {
    setError("");
    setMessage("");

    const { error: updateError } =
      await supabase
        .from("products")
        .update({
          is_active:
            !product.is_active,
        })
        .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      product.is_active
        ? "Produk dinonaktifkan."
        : "Produk diaktifkan."
    );

    await loadData();
  }

  async function toggleFeatured(
    product
  ) {
    setError("");
    setMessage("");

    const { error: updateError } =
      await supabase
        .from("products")
        .update({
          is_featured:
            !product.is_featured,
        })
        .eq("id", product.id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      product.is_featured
        ? "Produk dihapus dari pilihan."
        : "Produk dijadikan pilihan."
    );

    await loadData();
  }

  /* =======================================================
     CATEGORY FORM
  ======================================================= */

  function updateCategoryForm(
    field,
    value
  ) {
    setCategoryForm((current) => ({
      ...current,
      [field]: value,
    }));
  }

  function resetCategoryForm() {
    setEditingCategoryId(null);

    setCategoryForm({
      ...emptyCategoryForm,
    });
  }

  function editCategory(category) {
    setEditingCategoryId(
      category.id
    );

    setCategoryForm({
      name: category.name || "",
      slug: category.slug || "",
      description:
        category.description || "",
    });

    setMessage("");
    setError("");
  }

  /* =======================================================
     SAVE CATEGORY
  ======================================================= */

  async function saveCategory(event) {
    event.preventDefault();

    setSaving(true);
    setMessage("");
    setError("");

    if (!categoryForm.name.trim()) {
      setError(
        "Nama kategori wajib diisi."
      );
      setSaving(false);
      return;
    }

    const payload = {
      name:
        categoryForm.name.trim(),

      slug:
        categoryForm.slug.trim() ||
        slugify(categoryForm.name),

      description:
        categoryForm.description.trim() ||
        null,
    };

    const result =
      editingCategoryId
        ? await supabase
            .from("categories")
            .update(payload)
            .eq(
              "id",
              editingCategoryId
            )
        : await supabase
            .from("categories")
            .insert(payload);

    if (result.error) {
      setError(result.error.message);
    } else {
      setMessage(
        editingCategoryId
          ? "Kategori berhasil diperbarui."
          : "Kategori berhasil ditambahkan."
      );

      resetCategoryForm();

      await loadData();
    }

    setSaving(false);
  }

  /* =======================================================
     DELETE CATEGORY
  ======================================================= */

  async function deleteCategory(
    category
  ) {
    const usedProducts =
      products.filter(
        (product) =>
          product.category_id ===
          category.id
      );

    if (usedProducts.length > 0) {
      setError(
        `Kategori "${category.name}" masih digunakan oleh ${usedProducts.length} produk. Pindahkan produk tersebut terlebih dahulu.`
      );
      return;
    }

    if (
      !window.confirm(
        `Hapus kategori "${category.name}"?`
      )
    ) {
      return;
    }

    setError("");
    setMessage("");

    const { error: deleteError } =
      await supabase
        .from("categories")
        .delete()
        .eq(
          "id",
          category.id
        );

    if (deleteError) {
      setError(deleteError.message);
      return;
    }

    setMessage(
      "Kategori berhasil dihapus."
    );

    if (
      editingCategoryId ===
      category.id
    ) {
      resetCategoryForm();
    }

    await loadData();
  }

  /* =======================================================
     ORDER STATUS
  ======================================================= */

  async function updateOrderStatus(
    id,
    status
  ) {
    setError("");
    setMessage("");

    const { error: updateError } =
      await supabase
        .from("orders")
        .update({
          status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      "Status pesanan diperbarui."
    );

    await loadData();
  }

  /* =======================================================
     PAYMENT STATUS
  ======================================================= */

  async function updatePaymentStatus(
    id,
    payment_status
  ) {
    setError("");
    setMessage("");

    const { error: updateError } =
      await supabase
        .from("orders")
        .update({
          payment_status,
          updated_at:
            new Date().toISOString(),
        })
        .eq("id", id);

    if (updateError) {
      setError(updateError.message);
      return;
    }

    setMessage(
      "Status pembayaran diperbarui."
    );

    await loadData();
  }

  /* =======================================================
     ORDER DETAIL
  ======================================================= */

  async function toggleOrder(
    orderId
  ) {
    if (
      expandedOrder === orderId
    ) {
      setExpandedOrder(null);
      return;
    }

    setExpandedOrder(orderId);

    if (orderItems[orderId]) {
      return;
    }

    setLoadingOrderItems(true);

    const {
      data,
      error: itemsError,
    } = await supabase
      .from("order_items")
      .select("*")
      .eq(
        "order_id",
        orderId
      );

    if (itemsError) {
      setError(itemsError.message);
    } else {
      setOrderItems(
        (current) => ({
          ...current,
          [orderId]: data || [],
        })
      );
    }

    setLoadingOrderItems(false);
  }

  /* =======================================================
     REPORT RANGE
  ======================================================= */

  function getReportRange() {
    const now = new Date();

    if (
      reportPeriod ===
      "custom"
    ) {
      if (
        !customStart ||
        !customEnd
      ) {
        return null;
      }

      const start = startOfDay(
        new Date(customStart)
      );

      const end = endOfDay(
        new Date(customEnd)
      );

      return {
        start,
        end,
        label: `${dateOnly(
          start
        )} — ${dateOnly(end)}`,
      };
    }

    if (
      reportPeriod === "today"
    ) {
      return {
        start: startOfDay(now),
        end: endOfDay(now),
        label: "Hari Ini",
      };
    }

    if (
      reportPeriod ===
      "yesterday"
    ) {
      const yesterday =
        new Date(now);

      yesterday.setDate(
        yesterday.getDate() - 1
      );

      return {
        start:
          startOfDay(
            yesterday
          ),
        end:
          endOfDay(
            yesterday
          ),
        label: "Kemarin",
      };
    }

    if (
      reportPeriod ===
      "7days"
    ) {
      const start =
        new Date(now);

      start.setDate(
        start.getDate() - 6
      );

      return {
        start:
          startOfDay(start),
        end:
          endOfDay(now),
        label: "7 Hari Terakhir",
      };
    }

    if (
      reportPeriod ===
      "thisWeek"
    ) {
      return {
        start:
          getWeekStart(now),
        end:
          getWeekEnd(now),
        label: "Minggu Ini",
      };
    }

    if (
      reportPeriod ===
      "lastWeek"
    ) {
      const start =
        getWeekStart(now);

      start.setDate(
        start.getDate() - 7
      );

      const end =
        new Date(start);

      end.setDate(
        end.getDate() + 6
      );

      return {
        start,
        end: endOfDay(end),
        label: "Minggu Lalu",
      };
    }

    if (
      reportPeriod ===
      "thisMonth"
    ) {
      const start =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          1
        );

      const end =
        new Date(
          now.getFullYear(),
          now.getMonth() + 1,
          0
        );

      return {
        start:
          startOfDay(start),
        end:
          endOfDay(end),
        label: "Bulan Ini",
      };
    }

    if (
      reportPeriod ===
      "lastMonth"
    ) {
      const start =
        new Date(
          now.getFullYear(),
          now.getMonth() - 1,
          1
        );

      const end =
        new Date(
          now.getFullYear(),
          now.getMonth(),
          0
        );

      return {
        start:
          startOfDay(start),
        end:
          endOfDay(end),
        label: "Bulan Lalu",
      };
    }

    if (
      reportPeriod ===
      "30days"
    ) {
      const start =
        new Date(now);

      start.setDate(
        start.getDate() - 29
      );

      return {
        start:
          startOfDay(start),
        end:
          endOfDay(now),
        label: "30 Hari Terakhir",
      };
    }

    if (
      reportPeriod ===
      "thisYear"
    ) {
      const start =
        new Date(
          now.getFullYear(),
          0,
          1
        );

      const end =
        new Date(
          now.getFullYear(),
          11,
          31
        );

      return {
        start:
          startOfDay(start),
        end:
          endOfDay(end),
        label: "Tahun Ini",
      };
    }

    return null;
  }

  const reportData = useMemo(() => {
    const range =
      getReportRange();

    if (!range) {
      return {
        orders: [],
        label: "Periode belum lengkap",
        totalSales: 0,
        completed: 0,
        pending: 0,
        processing: 0,
        shipped: 0,
        cancelled: 0,
        paid: 0,
      };
    }

    const filtered =
      orders.filter((order) => {
        const date = new Date(
          order.created_at
        );

        return (
          date >= range.start &&
          date <= range.end
        );
      });

    return {
      orders: filtered,
      label: range.label,

      totalSales: filtered
        .filter(
          (order) =>
            order.status !==
            "cancelled"
        )
        .reduce(
          (sum, order) =>
            sum +
            Number(
              order.total || 0
            ),
          0
        ),

      completed:
        filtered.filter(
          (order) =>
            order.status ===
            "completed"
        ).length,

      pending:
        filtered.filter(
          (order) =>
            order.status ===
            "pending"
        ).length,

      processing:
        filtered.filter(
          (order) =>
            order.status ===
            "processing"
        ).length,

      shipped:
        filtered.filter(
          (order) =>
            order.status ===
            "shipped"
        ).length,

      cancelled:
        filtered.filter(
          (order) =>
            order.status ===
            "cancelled"
        ).length,

      paid:
        filtered.filter(
          (order) =>
            order.payment_status ===
            "paid"
        ).length,
    };
  }, [
    orders,
    reportPeriod,
    customStart,
    customEnd,
  ]);

  /* =======================================================
     EXPORT PDF
  ======================================================= */

  function exportSalesPDF() {
    if (
      reportPeriod ===
        "custom" &&
      (!customStart ||
        !customEnd)
    ) {
      setError(
        "Pilih tanggal awal dan tanggal akhir terlebih dahulu."
      );
      return;
    }

    const data =
      reportData;

    const doc =
      new jsPDF({
        orientation:
          "landscape",
        unit: "mm",
        format: "a4",
      });

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(20);

    doc.text(
      "NUSANTARA BATIK",
      14,
      17
    );

    doc.setFont(
      "helvetica",
      "normal"
    );

    doc.setFontSize(10);

    doc.text(
      "Laporan Penjualan",
      14,
      24
    );

    doc.text(
      `Periode: ${data.label}`,
      14,
      30
    );

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "Ringkasan",
      14,
      40
    );

    autoTable(doc, {
      startY: 44,

      theme: "grid",

      head: [
        [
          "Total Pesanan",
          "Completed",
          "Pending",
          "Processing",
          "Shipped",
          "Cancelled",
          "Paid",
          "Penjualan",
        ],
      ],

      body: [
        [
          data.orders.length,
          data.completed,
          data.pending,
          data.processing,
          data.shipped,
          data.cancelled,
          data.paid,
          money(data.totalSales),
        ],
      ],

      styles: {
        fontSize: 8,
        cellPadding: 3,
      },

      headStyles: {
        fontStyle: "bold",
      },
    });

    const tableStart =
      (doc.lastAutoTable?.finalY ||
        65) + 12;

    doc.setFont(
      "helvetica",
      "bold"
    );

    doc.setFontSize(12);

    doc.text(
      "Daftar Transaksi",
      14,
      tableStart
    );

    autoTable(doc, {
      startY:
        tableStart + 5,

      theme: "grid",

      head: [
        [
          "ID",
          "Tanggal",
          "Pelanggan",
          "No. HP",
          "Status",
          "Pembayaran",
          "Total",
        ],
      ],

      body: data.orders.map(
        (order) => [
          `#${order.id
            .slice(0, 8)
            .toUpperCase()}`,

          dateOnly(
            order.created_at
          ),

          order.customer_name ||
            "-",

          order.phone || "-",

          order.status || "-",

          order.payment_status ||
            "-",

          money(order.total),
        ]
      ),

      styles: {
        fontSize: 7.5,
        cellPadding: 2.5,
      },

      headStyles: {
        fontStyle: "bold",
      },
    });

    const safeLabel =
      data.label
        .toLowerCase()
        .replace(
          /[^a-z0-9]+/g,
          "-"
        )
        .replace(
          /^-+|-+$/g,
          ""
        );

    doc.save(
      `laporan-penjualan-${safeLabel || "nusantara-batik"}.pdf`
    );

    setMessage(
      "Laporan PDF berhasil dibuat."
    );
  }

  /* =======================================================
     ACCESS
  ======================================================= */

  if (
    profile?.role !== "admin"
  ) {
    return (
      <main className="admin-denied">
        <div>
          <span className="eyebrow">
            NUSANTARA BATIK / ADMIN
          </span>

          <h1>
            Akses admin diperlukan.
          </h1>

          <p>
            Akun ini tidak memiliki
            akses administrator.
          </p>

          <button
            className="button dark"
            onClick={logout}
          >
            <LogOut size={16} />
            Keluar
          </button>
        </div>
      </main>
    );
  }

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <main className="admin">

      {/* ===================================================
          HEADER
      =================================================== */}

      <header className="admin-head">

        <div>
          <span className="eyebrow">
            NUSANTARA BATIK / ADMIN
          </span>

          <h1>
            Dashboard
          </h1>

          <p>
            Kelola toko, katalog,
            stok, kategori, pesanan,
            dan laporan penjualan.
          </p>
        </div>

        <div className="admin-actions">

          <button
            type="button"
            onClick={loadData}
            disabled={loading}
          >
            <RefreshCw
              size={16}
              className={
                loading
                  ? "spin"
                  : ""
              }
            />
            Refresh
          </button>

          <button
            type="button"
            onClick={logout}
          >
            <LogOut size={16} />
            Keluar
          </button>

        </div>

      </header>

      {/* ===================================================
          NOTICES
      =================================================== */}

      {message && (
        <div className="notice success">

          <Check size={15} />

          <span>
            {message}
          </span>

          <button
            type="button"
            onClick={() =>
              setMessage("")
            }
          >
            <X size={14} />
          </button>

        </div>
      )}

      {error && (
        <div className="notice error">

          <X size={15} />

          <span>
            {error}
          </span>

          <button
            type="button"
            onClick={() =>
              setError("")
            }
          >
            <X size={14} />
          </button>

        </div>
      )}

      {/* ===================================================
          STATISTICS
      =================================================== */}

      <section className="admin-stats">

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Package size={20} />
          </div>

          <span>
            Total Produk
          </span>

          <b>
            {statistics.totalProducts}
          </b>

          <small>
            {statistics.activeProducts} aktif
          </small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <ShoppingBag size={20} />
          </div>

          <span>
            Total Pesanan
          </span>

          <b>
            {statistics.totalOrders}
          </b>

          <small>
            {statistics.pendingOrders} pending
          </small>
        </div>

        <div className="admin-stat-card">
          <div className="admin-stat-icon">
            <Tag size={20} />
          </div>

          <span>
            Penjualan
          </span>

          <b>
            {money(statistics.sales)}
          </b>

          <small>
            {statistics.completedOrders} selesai
          </small>
        </div>

        <div className="admin-stat-card warning">
          <div className="admin-stat-icon">
            <Archive size={20} />
          </div>

          <span>
            Stok Perlu Dicek
          </span>

          <b>
            {statistics.outOfStock +
              statistics.lowStock}
          </b>

          <small>
            {statistics.outOfStock} habis •{" "}
            {statistics.lowStock} menipis
          </small>
        </div>

      </section>

      {/* ===================================================
          NAVIGATION
      =================================================== */}

      <nav className="admin-tabs">

        <button
          type="button"
          className={
            activeTab === "overview"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "overview"
            )
          }
        >
          <LayoutDashboard
            size={16}
          />
          Ringkasan
        </button>

        <button
          type="button"
          className={
            activeTab === "products"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "products"
            )
          }
        >
          <Package size={16} />
          Produk
          <span>
            {products.length}
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "categories"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "categories"
            )
          }
        >
          <Tag size={16} />
          Kategori
          <span>
            {categories.length}
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "orders"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "orders"
            )
          }
        >
          <ShoppingBag
            size={16}
          />
          Pesanan
          <span>
            {orders.length}
          </span>
        </button>

        <button
          type="button"
          className={
            activeTab === "reports"
              ? "active"
              : ""
          }
          onClick={() =>
            setActiveTab(
              "reports"
            )
          }
        >
          <FileDown size={16} />
          Laporan
        </button>

      </nav>

      {/* ===================================================
          OVERVIEW
      =================================================== */}

      {activeTab === "overview" && (
        <section className="admin-overview">

          <div className="admin-overview-grid">

            {/* ORDER SUMMARY */}

            <section className="admin-panel">

              <div className="admin-section-head">

                <div>
                  <span className="eyebrow">
                    ORDER STATUS
                  </span>

                  <h2>
                    Status pesanan
                  </h2>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setActiveTab(
                      "orders"
                    )
                  }
                >
                  Lihat semua
                </button>

              </div>

              <div className="order-status-grid">

                <button
                  type="button"
                  onClick={() => {
                    setOrderFilter(
                      "pending"
                    );
                    setActiveTab(
                      "orders"
                    );
                  }}
                >
                  <span>
                    Pending
                  </span>

                  <strong>
                    {
                      statistics.pendingOrders
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderFilter(
                      "processing"
                    );
                    setActiveTab(
                      "orders"
                    );
                  }}
                >
                  <span>
                    Processing
                  </span>

                  <strong>
                    {
                      statistics.processingOrders
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderFilter(
                      "shipped"
                    );
                    setActiveTab(
                      "orders"
                    );
                  }}
                >
                  <span>
                    Shipped
                  </span>

                  <strong>
                    {
                      statistics.shippedOrders
                    }
                  </strong>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setOrderFilter(
                      "completed"
                    );
                    setActiveTab(
                      "orders"
                    );
                  }}
                >
                  <span>
                    Completed
                  </span>

                  <strong>
                    {
                      statistics.completedOrders
                    }
                  </strong>
                </button>

              </div>

            </section>

            {/* CATALOG */}

            <section className="admin-panel">

              <div className="admin-section-head">

                <div>
                  <span className="eyebrow">
                    CATALOG
                  </span>

                  <h2>
                    Kondisi katalog
                  </h2>
                </div>

                <button
                  type="button"
                  className="text-button"
                  onClick={() =>
                    setActiveTab(
                      "products"
                    )
                  }
                >
                  Kelola
                </button>

              </div>

              <div className="catalog-summary">

                <div>
                  <span>
                    Aktif
                  </span>

                  <strong>
                    {
                      statistics.activeProducts
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Pilihan
                  </span>

                  <strong>
                    {
                      statistics.featuredProducts
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Habis
                  </span>

                  <strong>
                    {
                      statistics.outOfStock
                    }
                  </strong>
                </div>

                <div>
                  <span>
                    Menipis
                  </span>

                  <strong>
                    {
                      statistics.lowStock
                    }
                  </strong>
                </div>

              </div>

            </section>

          </div>

          {/* RECENT ORDERS */}

          <section className="admin-panel">

            <div className="admin-section-head">

              <div>
                <span className="eyebrow">
                  RECENT ORDERS
                </span>

                <h2>
                  Pesanan terbaru
                </h2>
              </div>

              <button
                type="button"
                className="text-button"
                onClick={() =>
                  setActiveTab(
                    "orders"
                  )
                }
              >
                Semua pesanan
              </button>

            </div>

            {!orders.length ? (
              <div className="empty">
                Belum ada pesanan.
              </div>
            ) : (
              <div className="admin-order-list compact">

                {orders
                  .slice(0, 6)
                  .map((order) => (
                    <article
                      className="admin-order-row"
                      key={order.id}
                    >

                      <div className="admin-order-main">

                        <b>
                          #
                          {order.id
                            .slice(0, 8)
                            .toUpperCase()}
                        </b>

                        <span>
                          {order.customer_name ||
                            "Pelanggan"}
                        </span>

                        <small>
                          {dateTime(
                            order.created_at
                          )}
                        </small>

                      </div>

                      <strong>
                        {money(
                          order.total
                        )}
                      </strong>

                      <span
                        className={`status ${
                          order.status ||
                          "pending"
                        }`}
                      >
                        {order.status ||
                          "pending"}
                      </span>

                    </article>
                  ))}

              </div>
            )}

          </section>

        </section>
      )}

      {/* ===================================================
          PRODUCTS
      =================================================== */}

      {activeTab === "products" && (
        <section className="admin-products-page">

          <div className="admin-grid">

            {/* PRODUCT FORM */}

            <form
              className="admin-form"
              onSubmit={saveProduct}
            >

              <div className="admin-form-head">

                <div>
                  <span className="eyebrow">
                    PRODUCT MANAGEMENT
                  </span>

                  <h2>
                    {editingProductId
                      ? "Edit produk"
                      : "Tambah produk"}
                  </h2>
                </div>

                {editingProductId && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={
                      resetProductForm
                    }
                  >
                    Batal
                  </button>
                )}

              </div>

              <label>
                Nama produk

                <input
                  required
                  value={
                    productForm.name
                  }
                  onChange={(event) =>
                    updateProductForm(
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: Kemeja Batik Parang"
                />
              </label>

              <label>
                Kategori

                <select
                  required
                  value={
                    productForm.category_id
                  }
                  onChange={(event) =>
                    updateProductForm(
                      "category_id",
                      event.target
                        .value
                    )
                  }
                >
                  <option value="">
                    Pilih kategori
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>
              </label>

              <div className="form-two">

                <label>
                  Harga

                  <input
                    type="number"
                    min="0"
                    required
                    value={
                      productForm.price
                    }
                    onChange={(
                      event
                    ) =>
                      updateProductForm(
                        "price",
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  Harga coret

                  <input
                    type="number"
                    min="0"
                    value={
                      productForm.compare_price
                    }
                    onChange={(
                      event
                    ) =>
                      updateProductForm(
                        "compare_price",
                        event.target
                          .value
                      )
                    }
                  />
                </label>

              </div>

              <div className="form-two">

                <label>
                  Stok

                  <input
                    type="number"
                    min="0"
                    required
                    value={
                      productForm.stock
                    }
                    onChange={(
                      event
                    ) =>
                      updateProductForm(
                        "stock",
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  SKU

                  <input
                    value={
                      productForm.sku
                    }
                    onChange={(
                      event
                    ) =>
                      updateProductForm(
                        "sku",
                        event.target
                          .value
                      )
                    }
                    placeholder="NB-001"
                  />
                </label>

              </div>

              <label>
                Ukuran

                <input
                  value={
                    productForm.sizes
                  }
                  onChange={(event) =>
                    updateProductForm(
                      "sizes",
                      event.target
                        .value
                    )
                  }
                  placeholder="S,M,L,XL"
                />

                <small>
                  Pisahkan dengan koma.
                </small>
              </label>

              <label>
                Warna

                <input
                  value={
                    productForm.colors
                  }
                  onChange={(event) =>
                    updateProductForm(
                      "colors",
                      event.target
                        .value
                    )
                  }
                  placeholder="Navy,Cokelat,Hitam"
                />

                <small>
                  Pisahkan dengan koma.
                </small>
              </label>

              <label>
                URL gambar

                <input
                  type="url"
                  value={
                    productForm.image_url
                  }
                  onChange={(event) =>
                    updateProductForm(
                      "image_url",
                      event.target
                        .value
                    )
                  }
                  placeholder="https://..."
                />
              </label>

              {productForm.image_url && (
                <div className="admin-image-preview">

                  <img
                    src={
                      productForm.image_url
                    }
                    alt={
                      productForm.name ||
                      "Preview"
                    }
                    onError={(event) => {
                      event.currentTarget.src =
                        fallbackImage;
                    }}
                  />

                  <div>
                    <ImageIcon
                      size={15}
                    />

                    <span>
                      Preview gambar
                    </span>
                  </div>

                </div>
              )}

              <label>
                Deskripsi

                <textarea
                  rows="6"
                  value={
                    productForm.description
                  }
                  onChange={(event) =>
                    updateProductForm(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Deskripsi produk..."
                />
              </label>

              <div className="check-group">

                <label className="check">

                  <input
                    type="checkbox"
                    checked={
                      productForm.is_active
                    }
                    onChange={(event) =>
                      updateProductForm(
                        "is_active",
                        event.target
                          .checked
                      )
                    }
                  />

                  <span>
                    Produk aktif
                  </span>

                </label>

                <label className="check">

                  <input
                    type="checkbox"
                    checked={
                      productForm.is_featured
                    }
                    onChange={(event) =>
                      updateProductForm(
                        "is_featured",
                        event.target
                          .checked
                      )
                    }
                  />

                  <span>
                    Produk pilihan
                  </span>

                </label>

              </div>

              <button
                className="button dark wide"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin"
                    />
                    Menyimpan...
                  </>
                ) : editingProductId ? (
                  <>
                    <Edit3 size={16} />
                    Simpan perubahan
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Tambah produk
                  </>
                )}
              </button>

            </form>

            {/* PRODUCT LIST */}

            <section className="admin-products">

              <div className="admin-section-head">

                <div>
                  <span className="eyebrow">
                    PRODUCT LIST
                  </span>

                  <h2>
                    Semua produk
                  </h2>
                </div>

                <span>
                  {
                    filteredProducts.length
                  }{" "}
                  /{" "}
                  {
                    products.length
                  }
                </span>

              </div>

              <div className="admin-filters">

                <div className="admin-search">

                  <Search
                    size={16}
                  />

                  <input
                    value={
                      productSearch
                    }
                    onChange={(event) =>
                      setProductSearch(
                        event.target
                          .value
                      )
                    }
                    placeholder="Cari nama, SKU, slug..."
                  />

                </div>

                <select
                  value={
                    productCategory
                  }
                  onChange={(event) =>
                    setProductCategory(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="all">
                    Semua kategori
                  </option>

                  {categories.map(
                    (category) => (
                      <option
                        key={
                          category.id
                        }
                        value={
                          category.id
                        }
                      >
                        {
                          category.name
                        }
                      </option>
                    )
                  )}
                </select>

                <select
                  value={
                    productStatus
                  }
                  onChange={(event) =>
                    setProductStatus(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="all">
                    Semua produk
                  </option>

                  <option value="active">
                    Aktif
                  </option>

                  <option value="inactive">
                    Nonaktif
                  </option>

                  <option value="featured">
                    Produk pilihan
                  </option>

                  <option value="low">
                    Stok menipis
                  </option>

                  <option value="out">
                    Stok habis
                  </option>
                </select>

              </div>

              {loading ? (
                <div className="empty">
                  Memuat produk...
                </div>
              ) : !filteredProducts.length ? (
                <div className="empty">
                  Produk tidak ditemukan.
                </div>
              ) : (
                <div className="admin-product-list">

                  {filteredProducts.map(
                    (product) => {

                      const stock =
                        Number(
                          product.stock ||
                            0
                        );

                      return (
                        <article
                          className="admin-product"
                          key={
                            product.id
                          }
                        >

                          <div className="admin-product-image">

                            <img
                              src={
                                product.image_url ||
                                fallbackImage
                              }
                              alt=""
                              onError={(
                                event
                              ) => {
                                event.currentTarget.src =
                                  fallbackImage;
                              }}
                            />

                            {product.is_featured && (
                              <span>
                                Pilihan
                              </span>
                            )}

                          </div>

                          <div className="admin-product-info">

                            <div className="admin-product-title">

                              <b>
                                {
                                  product.name
                                }
                              </b>

                              <span>
                                {
                                  product
                                    .categories
                                    ?.name ||
                                  "Tanpa kategori"
                                }
                              </span>

                            </div>

                            <strong>
                              {money(
                                product.price
                              )}
                            </strong>

                            <div className="admin-product-meta">

                              <small>
                                SKU{" "}
                                {product.sku ||
                                  "-"}
                              </small>

                              <small
                                className={
                                  stock <= 0
                                    ? "stock-out"
                                    : stock <= 5
                                    ? "stock-low"
                                    : ""
                                }
                              >
                                Stok{" "}
                                {stock}
                              </small>

                            </div>

                          </div>

                          <div className="admin-product-actions">

                            <button
                              type="button"
                              title={
                                product.is_active
                                  ? "Nonaktifkan"
                                  : "Aktifkan"
                              }
                              onClick={() =>
                                toggleProductActive(
                                  product
                                )
                              }
                            >
                              <Eye
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              title={
                                product.is_featured
                                  ? "Hapus pilihan"
                                  : "Jadikan pilihan"
                              }
                              onClick={() =>
                                toggleFeatured(
                                  product
                                )
                              }
                            >
                              <Tag
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                editProduct(
                                  product
                                )
                              }
                            >
                              <Edit3
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              title="Hapus"
                              className="danger"
                              onClick={() =>
                                deleteProduct(
                                  product.id
                                )
                              }
                            >
                              <Trash2
                                size={15}
                              />
                            </button>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </div>

        </section>
      )}

      {/* ===================================================
          CATEGORIES
      =================================================== */}

      {activeTab === "categories" && (
        <section className="admin-category-page">

          <div className="admin-category-grid">

            {/* CATEGORY FORM */}

            <form
              className="admin-form"
              onSubmit={saveCategory}
            >

              <div className="admin-form-head">

                <div>
                  <span className="eyebrow">
                    CATEGORY MANAGEMENT
                  </span>

                  <h2>
                    {editingCategoryId
                      ? "Edit kategori"
                      : "Tambah kategori"}
                  </h2>
                </div>

                {editingCategoryId && (
                  <button
                    type="button"
                    className="text-button"
                    onClick={
                      resetCategoryForm
                    }
                  >
                    Batal
                  </button>
                )}

              </div>

              <label>
                Nama kategori

                <input
                  required
                  value={
                    categoryForm.name
                  }
                  onChange={(event) =>
                    updateCategoryForm(
                      "name",
                      event.target
                        .value
                    )
                  }
                  placeholder="Contoh: Batik Pria"
                />
              </label>

              <label>
                Slug

                <input
                  value={
                    categoryForm.slug
                  }
                  onChange={(event) =>
                    updateCategoryForm(
                      "slug",
                      event.target
                        .value
                    )
                  }
                  placeholder="batik-pria"
                />

                <small>
                  Jika dikosongkan,
                  slug dibuat otomatis.
                </small>
              </label>

              <label>
                Deskripsi

                <textarea
                  rows="6"
                  value={
                    categoryForm.description
                  }
                  onChange={(event) =>
                    updateCategoryForm(
                      "description",
                      event.target
                        .value
                    )
                  }
                  placeholder="Deskripsi kategori..."
                />
              </label>

              <button
                className="button dark wide"
                disabled={saving}
              >
                {saving ? (
                  <>
                    <RefreshCw
                      size={16}
                      className="spin"
                    />
                    Menyimpan...
                  </>
                ) : editingCategoryId ? (
                  <>
                    <Edit3 size={16} />
                    Simpan kategori
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    Tambah kategori
                  </>
                )}
              </button>

            </form>

            {/* CATEGORY LIST */}

            <section className="admin-panel">

              <div className="admin-section-head">

                <div>
                  <span className="eyebrow">
                    CATEGORY LIST
                  </span>

                  <h2>
                    Semua kategori
                  </h2>
                </div>

                <span>
                  {
                    filteredCategories.length
                  }{" "}
                  kategori
                </span>

              </div>

              <div className="admin-search">

                <Search
                  size={16}
                />

                <input
                  value={
                    categorySearch
                  }
                  onChange={(event) =>
                    setCategorySearch(
                      event.target
                        .value
                    )
                  }
                  placeholder="Cari kategori..."
                />

              </div>

              {!filteredCategories.length ? (
                <div className="empty">
                  Belum ada kategori.
                </div>
              ) : (
                <div className="admin-category-list">

                  {filteredCategories.map(
                    (category) => {

                      const count =
                        products.filter(
                          (product) =>
                            product.category_id ===
                            category.id
                        ).length;

                      return (
                        <article
                          className="admin-category-row"
                          key={
                            category.id
                          }
                        >

                          <div className="category-icon">
                            <Tag
                              size={18}
                            />
                          </div>

                          <div className="category-info">

                            <b>
                              {
                                category.name
                              }
                            </b>

                            <span>
                              /
                              {
                                category.slug
                              }
                            </span>

                            <small>
                              {count} produk
                            </small>

                            {category.description && (
                              <p>
                                {
                                  category.description
                                }
                              </p>
                            )}

                          </div>

                          <div className="admin-category-actions">

                            <button
                              type="button"
                              title="Edit"
                              onClick={() =>
                                editCategory(
                                  category
                                )
                              }
                            >
                              <Edit3
                                size={15}
                              />
                            </button>

                            <button
                              type="button"
                              title="Hapus"
                              className="danger"
                              onClick={() =>
                                deleteCategory(
                                  category
                                )
                              }
                            >
                              <Trash2
                                size={15}
                              />
                            </button>

                          </div>

                        </article>
                      );
                    }
                  )}

                </div>
              )}

            </section>

          </div>

        </section>
      )}

      {/* ===================================================
          ORDERS
      =================================================== */}

      {activeTab === "orders" && (
        <section className="admin-orders">

          <div className="admin-section-head">

            <div>
              <span className="eyebrow">
                ORDER MANAGEMENT
              </span>

              <h2>
                Pesanan pelanggan
              </h2>

              <p>
                Kelola status pesanan
                dan pembayaran.
              </p>
            </div>

            <button
              type="button"
              className="button"
              onClick={loadData}
            >
              <RefreshCw
                size={15}
              />
              Refresh
            </button>

          </div>

          <div className="admin-order-filters">

            <div className="admin-search">

              <Search
                size={16}
              />

              <input
                value={
                  orderSearch
                }
                onChange={(event) =>
                  setOrderSearch(
                    event.target
                      .value
                  )
                }
                placeholder="Cari nama, HP, email, ID order..."
              />

            </div>

            <div className="filter-label">

              <Filter
                size={15}
              />

              <select
                value={
                  orderFilter
                }
                onChange={(event) =>
                  setOrderFilter(
                    event.target
                      .value
                  )
                }
              >
                <option value="all">
                  Semua status
                </option>

                <option value="pending">
                  Pending
                </option>

                <option value="paid">
                  Paid
                </option>

                <option value="processing">
                  Processing
                </option>

                <option value="shipped">
                  Shipped
                </option>

                <option value="completed">
                  Completed
                </option>

                <option value="cancelled">
                  Cancelled
                </option>
              </select>

            </div>

          </div>

          {!filteredOrders.length ? (
            <div className="empty">
              Belum ada pesanan
              untuk filter ini.
            </div>
          ) : (
            <div className="admin-order-list">

              {filteredOrders.map(
                (order) => {

                  const isExpanded =
                    expandedOrder ===
                    order.id;

                  const items =
                    orderItems[
                      order.id
                    ] || [];

                  return (
                    <article
                      className={`admin-order-card ${
                        isExpanded
                          ? "expanded"
                          : ""
                      }`}
                      key={order.id}
                    >

                      <div className="admin-order-row">

                        <button
                          type="button"
                          className="order-expand"
                          onClick={() =>
                            toggleOrder(
                              order.id
                            )
                          }
                        >
                          {isExpanded ? (
                            <ChevronUp
                              size={17}
                            />
                          ) : (
                            <ChevronDown
                              size={17}
                            />
                          )}
                        </button>

                        <div className="admin-order-main">

                          <b>
                            #
                            {order.id
                              .slice(
                                0,
                                8
                              )
                              .toUpperCase()}
                          </b>

                          <span>
                            {
                              order.customer_name ||
                              "Pelanggan"
                            }
                          </span>

                          <small>
                            {
                              order.phone ||
                              "-"
                            }
                          </small>

                          <small>
                            {dateTime(
                              order.created_at
                            )}
                          </small>

                        </div>

                        <div className="admin-order-total">

                          <strong>
                            {money(
                              order.total
                            )}
                          </strong>

                          <small>
                            {
                              order.customer_email ||
                              "-"
                            }
                          </small>

                        </div>

                        <select
                          value={
                            order.status ||
                            "pending"
                          }
                          onChange={(
                            event
                          ) =>
                            updateOrderStatus(
                              order.id,
                              event.target
                                .value
                            )
                          }
                        >
                          <option value="pending">
                            Pending
                          </option>

                          <option value="paid">
                            Paid
                          </option>

                          <option value="processing">
                            Processing
                          </option>

                          <option value="shipped">
                            Shipped
                          </option>

                          <option value="completed">
                            Completed
                          </option>

                          <option value="cancelled">
                            Cancelled
                          </option>
                        </select>

                        <select
                          value={
                            order.payment_status ||
                            "unpaid"
                          }
                          onChange={(
                            event
                          ) =>
                            updatePaymentStatus(
                              order.id,
                              event.target
                                .value
                            )
                          }
                        >
                          <option value="unpaid">
                            Unpaid
                          </option>

                          <option value="paid">
                            Paid
                          </option>

                          <option value="failed">
                            Failed
                          </option>

                          <option value="refunded">
                            Refunded
                          </option>
                        </select>

                      </div>

                      {isExpanded && (
                        <div className="admin-order-detail">

                          <div className="admin-order-detail-grid">

                            <div className="order-box">

                              <span className="eyebrow">
                                CUSTOMER
                              </span>

                              <h3>
                                Pelanggan
                              </h3>

                              <p>
                                <b>
                                  {
                                    order.customer_name ||
                                    "-"
                                  }
                                </b>
                              </p>

                              <p>
                                {
                                  order.phone ||
                                  "-"
                                }
                              </p>

                              <p>
                                {
                                  order.customer_email ||
                                  "-"
                                }
                              </p>

                            </div>

                            <div className="order-box">

                              <span className="eyebrow">
                                DELIVERY
                              </span>

                              <h3>
                                Alamat
                              </h3>

                              <p>
                                {
                                  order.address ||
                                  "Alamat tidak tersedia."
                                }
                              </p>

                            </div>

                            <div className="order-box">

                              <span className="eyebrow">
                                NOTE
                              </span>

                              <h3>
                                Catatan
                              </h3>

                              <p>
                                {
                                  order.notes ||
                                  "Tidak ada catatan."
                                }
                              </p>

                            </div>

                          </div>

                          <div className="order-items-admin">

                            <div className="admin-section-head">

                              <div>
                                <span className="eyebrow">
                                  ORDER ITEMS
                                </span>

                                <h3>
                                  Produk pesanan
                                </h3>
                              </div>

                            </div>

                            {loadingOrderItems &&
                            !orderItems[
                              order.id
                            ] ? (
                              <div className="empty">
                                Memuat item...
                              </div>
                            ) : !items.length ? (
                              <div className="empty">
                                Detail item tidak tersedia.
                              </div>
                            ) : (
                              <div className="admin-order-items">

                                {items.map(
                                  (
                                    item,
                                    index
                                  ) => (
                                    <div
                                      className="admin-order-item"
                                      key={
                                        item.id ||
                                        index
                                      }
                                    >

                                      <img
                                        src={
                                          item.image_url ||
                                          fallbackImage
                                        }
                                        alt=""
                                        onError={(
                                          event
                                        ) => {
                                          event.currentTarget.src =
                                            fallbackImage;
                                        }}
                                      />

                                      <div>

                                        <b>
                                          {
                                            item.product_name ||
                                            item.name ||
                                            "Produk"
                                          }
                                        </b>

                                        <span>
                                          Qty{" "}
                                          {
                                            item.quantity ||
                                            1
                                          }
                                        </span>

                                        {item.size && (
                                          <small>
                                            Ukuran:{" "}
                                            {
                                              item.size
                                            }
                                          </small>
                                        )}

                                        {item.color && (
                                          <small>
                                            Warna:{" "}
                                            {
                                              item.color
                                            }
                                          </small>
                                        )}

                                      </div>

                                      <strong>
                                        {money(
                                          Number(
                                            item.price ||
                                              0
                                          ) *
                                            Number(
                                              item.quantity ||
                                                1
                                            )
                                        )}
                                      </strong>

                                    </div>
                                  )
                                )}

                              </div>
                            )}

                          </div>

                        </div>
                      )}

                    </article>
                  );
                }
              )}

            </div>
          )}

        </section>
      )}

      {/* ===================================================
          REPORT
      =================================================== */}

      {activeTab === "reports" && (
        <section className="admin-reports">

          <div className="admin-section-head">

            <div>
              <span className="eyebrow">
                SALES REPORT
              </span>

              <h2>
                Laporan penjualan
              </h2>

              <p>
                Pilih periode lalu
                export laporan transaksi
                ke PDF.
              </p>
            </div>

          </div>

          <section className="report-filter-panel">

            <div className="report-period">

              <label>
                Periode laporan

                <select
                  value={
                    reportPeriod
                  }
                  onChange={(event) =>
                    setReportPeriod(
                      event.target
                        .value
                    )
                  }
                >
                  <option value="today">
                    Hari ini
                  </option>

                  <option value="yesterday">
                    Kemarin
                  </option>

                  <option value="7days">
                    7 hari terakhir
                  </option>

                  <option value="thisWeek">
                    Minggu ini
                  </option>

                  <option value="lastWeek">
                    Minggu lalu
                  </option>

                  <option value="thisMonth">
                    Bulan ini
                  </option>

                  <option value="lastMonth">
                    Bulan lalu
                  </option>

                  <option value="30days">
                    30 hari terakhir
                  </option>

                  <option value="thisYear">
                    Tahun ini
                  </option>

                  <option value="custom">
                    Custom
                  </option>
                </select>
              </label>

            </div>

            {reportPeriod ===
              "custom" && (
              <div className="report-custom">

                <label>
                  Dari

                  <input
                    type="date"
                    value={
                      customStart
                    }
                    onChange={(event) =>
                      setCustomStart(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

                <label>
                  Sampai

                  <input
                    type="date"
                    value={
                      customEnd
                    }
                    onChange={(event) =>
                      setCustomEnd(
                        event.target
                          .value
                      )
                    }
                  />
                </label>

              </div>
            )}

            <button
              type="button"
              className="button dark"
              onClick={
                exportSalesPDF
              }
            >
              <FileDown
                size={16}
              />
              Export PDF
            </button>

          </section>

          <div className="report-period-title">

            <span>
              Periode
            </span>

            <strong>
              {reportData.label}
            </strong>

          </div>

          <section className="report-stats">

            <div>
              <span>
                Total Pesanan
              </span>

              <strong>
                {
                  reportData
                    .orders.length
                }
              </strong>
            </div>

            <div>
              <span>
                Penjualan
              </span>

              <strong>
                {money(
                  reportData.totalSales
                )}
              </strong>
            </div>

            <div>
              <span>
                Completed
              </span>

              <strong>
                {
                  reportData.completed
                }
              </strong>
            </div>

            <div>
              <span>
                Paid
              </span>

              <strong>
                {reportData.paid}
              </strong>
            </div>

            <div>
              <span>
                Pending
              </span>

              <strong>
                {
                  reportData.pending
                }
              </strong>
            </div>

            <div>
              <span>
                Processing
              </span>

              <strong>
                {
                  reportData.processing
                }
              </strong>
            </div>

            <div>
              <span>
                Shipped
              </span>

              <strong>
                {
                  reportData.shipped
                }
              </strong>
            </div>

            <div>
              <span>
                Cancelled
              </span>

              <strong>
                {
                  reportData.cancelled
                }
              </strong>
            </div>

          </section>

          <section className="admin-panel report-table-panel">

            <div className="admin-section-head">

              <div>
                <span className="eyebrow">
                  TRANSACTIONS
                </span>

                <h2>
                  Daftar transaksi
                </h2>
              </div>

              <span>
                {
                  reportData
                    .orders.length
                }{" "}
                transaksi
              </span>

            </div>

            {!reportData.orders.length ? (
              <div className="empty">
                Tidak ada transaksi
                pada periode ini.
              </div>
            ) : (
              <div className="report-table-wrap">

                <table className="report-table">

                  <thead>
                    <tr>
                      <th>
                        Order
                      </th>

                      <th>
                        Tanggal
                      </th>

                      <th>
                        Pelanggan
                      </th>

                      <th>
                        Status
                      </th>

                      <th>
                        Pembayaran
                      </th>

                      <th>
                        Total
                      </th>
                    </tr>
                  </thead>

                  <tbody>

                    {reportData.orders.map(
                      (order) => (
                        <tr
                          key={
                            order.id
                          }
                        >

                          <td>
                            #
                            {order.id
                              .slice(
                                0,
                                8
                              )
                              .toUpperCase()}
                          </td>

                          <td>
                            {dateOnly(
                              order.created_at
                            )}
                          </td>

                          <td>
                            {
                              order.customer_name ||
                              "-"
                            }
                          </td>

                          <td>
                            <span
                              className={`status ${
                                order.status ||
                                "pending"
                              }`}
                            >
                              {
                                order.status ||
                                "-"
                              }
                            </span>
                          </td>

                          <td>
                            {
                              order.payment_status ||
                              "-"
                            }
                          </td>

                          <td>
                            <strong>
                              {money(
                                order.total
                              )}
                            </strong>
                          </td>

                        </tr>
                      )
                    )}

                  </tbody>

                </table>

              </div>
            )}

          </section>

        </section>
      )}

    </main>
  );
}