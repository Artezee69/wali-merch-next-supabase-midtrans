"use client";

import { useCartContext } from "@/components/CartProvider";
import AddToCartForm from "./AddToCart";

type AddToCartBoxProps = {
  productId: string;
  name: string;
  slug: string;
  price: number;
  image?: string;
  option1Label?: string;
  option2Label?: string;
  variants: {
    id: string;
    option1: string | null;
    option2: string | null;
    legacyColor?: string | null;
    stock: number;
    price?: number | null;
  }[];
};

export default function AddToCartBox({
  productId,
  name,
  slug,
  price,
  image,
  option1Label,
  option2Label,
  variants,
}: AddToCartBoxProps) {
  const { addItem } = useCartContext();
  return (
    <AddToCartForm
      productId={productId}
      name={name}
      slug={slug}
      price={price}
      image={image}
      option1Label={option1Label}
      option2Label={option2Label}
      variants={variants}
      addItem={addItem}
    />
  );
}
