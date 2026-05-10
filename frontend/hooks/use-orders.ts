"use client"

import { useState, useEffect } from "react"
import { api, type Order } from "@/lib/api"

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const data = await api.getOrders()
        setOrders(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch orders")
        console.error("Error fetching orders:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrders()
  }, [])

  const createOrder = async (orderData: Partial<Order>) => {
    setLoading(true)
    setError(null)

    try {
      const newOrder = await api.createOrder(orderData)
      setOrders((prev) => [...prev, newOrder])
      return newOrder
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create order")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const updateOrder = async (id: string, orderData: Partial<Order>) => {
    setLoading(true)
    setError(null)

    try {
      const updatedOrder = await api.updateOrder(id, orderData)
      setOrders((prev) => prev.map((order) => (order.id === id ? updatedOrder : order)))
      return updatedOrder
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order")
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteOrder = async (id: string) => {
    setLoading(true)
    setError(null)

    try {
      await api.deleteOrder(id)
      setOrders((prev) => prev.filter((order) => order.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete order")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    orders,
    loading,
    error,
    createOrder,
    updateOrder,
    deleteOrder,
  }
}

export function useOrder(id: string) {
  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const data = await api.getOrder(id)
        setOrder(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch order")
        console.error("Error fetching order:", err)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [id])

  const updateOrder = async (orderData: Partial<Order>) => {
    setLoading(true)
    setError(null)

    try {
      const updatedOrder = await api.updateOrder(id, orderData)
      setOrder(updatedOrder)
      return updatedOrder
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update order")
      throw err
    } finally {
      setLoading(false)
    }
  }

  return {
    order,
    loading,
    error,
    updateOrder,
  }
}