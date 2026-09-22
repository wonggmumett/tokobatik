import { createContext, useContext, useEffect, useMemo, useState } from "react";
const CartContext=createContext(null);
const KEY="nusantara-batik-cart";

export function CartProvider({children}){
  const [items,setItems]=useState(()=>{
    try{return JSON.parse(localStorage.getItem(KEY))||[]}catch{return []}
  });
  useEffect(()=>localStorage.setItem(KEY,JSON.stringify(items)),[items]);

  function addItem(product,size="All",quantity=1){
    setItems(cur=>{
      const id=`${product.id}-${size}`;
      const found=cur.find(x=>x.cartId===id);
      if(found) return cur.map(x=>x.cartId===id?{...x,quantity:x.quantity+quantity}:x);
      return [...cur,{cartId:id,product,size,quantity}];
    });
  }
  function update(cartId,quantity){
    setItems(cur=>cur.map(x=>x.cartId===cartId?{...x,quantity:Math.max(1,quantity)}:x));
  }
  function remove(cartId){setItems(cur=>cur.filter(x=>x.cartId!==cartId))}
  function clear(){setItems([])}
  const count=useMemo(()=>items.reduce((n,x)=>n+x.quantity,0),[items]);
  const total=useMemo(()=>items.reduce((n,x)=>n+Number(x.product.price||0)*x.quantity,0),[items]);
  return <CartContext.Provider value={{items,count,total,addItem,update,remove,clear}}>{children}</CartContext.Provider>
}
export const useCart=()=>useContext(CartContext);