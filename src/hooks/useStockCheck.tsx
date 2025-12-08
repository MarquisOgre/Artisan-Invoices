import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

interface StockData {
  product_name: string;
  size: string | null;
  closing_stock: number;
}

export const useStockCheck = () => {
  const [stockData, setStockData] = useState<StockData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStock();
  }, []);

  const fetchStock = async () => {
    try {
      const currentDate = new Date();
      const month = currentDate.getMonth() + 1;
      const year = currentDate.getFullYear();

      const { data, error } = await supabase
        .from('stock_register')
        .select('product_name, size, closing_stock')
        .eq('month', month)
        .eq('year', year);

      if (error) throw error;
      setStockData(data || []);
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  const getAvailableStock = (productName: string, size?: string): number => {
    if (size) {
      const stock = stockData.find(
        s => s.product_name === productName && s.size === size
      );
      return stock?.closing_stock || 0;
    }
    // Sum all sizes for the product if no size specified
    return stockData
      .filter(s => s.product_name === productName)
      .reduce((sum, s) => sum + (s.closing_stock || 0), 0);
  };

  const isStockAvailable = (productName: string, size?: string, quantity: number = 1): boolean => {
    return getAvailableStock(productName, size) >= quantity;
  };

  const hasAnyStock = (productName: string): boolean => {
    return stockData.some(s => s.product_name === productName && s.closing_stock > 0);
  };

  const isProductInStock = (productName: string, size: string): boolean => {
    const stock = stockData.find(
      s => s.product_name === productName && s.size === size
    );
    return stock !== undefined && stock.closing_stock > 0;
  };

  return { 
    stockData,
    getAvailableStock, 
    isStockAvailable, 
    hasAnyStock,
    isProductInStock,
    loading, 
    refreshStock: fetchStock 
  };
};
