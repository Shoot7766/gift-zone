"use client";
import React from "react";
import { Check, Clock, Gift, Truck, CheckCircle2, Store } from "lucide-react";
import { motion } from "framer-motion";

type OrderStatus =
  | "pending"
  | "accepted"
  | "preparing"
  | "ready_for_pickup"
  | "out_for_delivery"
  | "delivered"
  | "cancelled";

interface OrderStepperProps {
  status: OrderStatus;
  fulfillmentType?: string | null;
}

export const OrderStepper: React.FC<OrderStepperProps> = ({ status, fulfillmentType }) => {
  const ft = fulfillmentType === "pickup" ? "pickup" : "shop_delivery";

  if (status === "cancelled") {
    return (
      <div style={{ background: "#FEF2F2", color: "#B91C1C", padding: "1rem", borderRadius: "12px", textAlign: "center", fontSize: "0.9rem", fontWeight: "700" }}>
        ⚠️ Buyurtma bekor qilingan
      </div>
    );
  }

  const stepsPickup = [
    { id: "pending", label: "Qabul", icon: <Clock size={18} /> },
    { id: "preparing", label: "Tayyorlanmoqda", icon: <Gift size={18} /> },
    { id: "ready_for_pickup", label: "Olib ketishga tayyor", icon: <Store size={18} /> },
    { id: "delivered", label: "Topshirildi", icon: <CheckCircle2 size={18} /> },
  ];

  const stepsDelivery = [
    { id: "pending", label: "Qabul", icon: <Clock size={18} /> },
    { id: "preparing", label: "Tayyorlanmoqda", icon: <Gift size={18} /> },
    { id: "out_for_delivery", label: "Yo'lda", icon: <Truck size={18} /> },
    { id: "delivered", label: "Yetkazildi", icon: <CheckCircle2 size={18} /> },
  ];

  const steps = ft === "pickup" ? stepsPickup : stepsDelivery;

  const getStepIndex = (s: string) => {
    if (s === "pending" || s === "accepted") return 0;
    if (s === "preparing") return 1;
    if (ft === "pickup") {
      if (s === "ready_for_pickup" || s === "out_for_delivery") return 2;
      if (s === "delivered") return 3;
    } else {
      if (s === "ready_for_pickup") return 1;
      if (s === "out_for_delivery") return 2;
      if (s === "delivered") return 3;
    }
    return 0;
  };

  const currentStep = getStepIndex(status);

  return (
    <div style={{ padding: "1.5rem 0", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", position: "relative" }}>
        <div style={{ position: "absolute", top: "20px", left: "0", right: "0", height: "4px", background: "var(--gray-200)", borderRadius: "2px", zIndex: 0 }} />

        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${(currentStep / Math.max(1, steps.length - 1)) * 100}%` }}
          transition={{ duration: 0.8, ease: "easeInOut" }}
          style={{ position: "absolute", top: "20px", left: "0", height: "4px", background: "var(--teal)", borderRadius: "2px", zIndex: 1 }}
        />

        {steps.map((step, index) => {
          const isActive = index <= currentStep;
          const isCurrent = index === currentStep;

          return (
            <div key={step.id} style={{ position: "relative", zIndex: 2, display: "flex", flexDirection: "column", alignItems: "center", width: "80px" }}>
              <motion.div
                initial={false}
                animate={{
                  background: isActive ? "var(--teal)" : "white",
                  borderColor: isActive ? "var(--teal)" : "var(--gray-300)",
                  scale: isCurrent ? 1.2 : 1,
                  boxShadow: isCurrent ? "0 0 15px rgba(20, 184, 166, 0.4)" : "none",
                }}
                style={{
                  width: "40px",
                  height: "40px",
                  borderRadius: "50%",
                  border: "3px solid",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: isActive ? "white" : "var(--gray-400)",
                  transition: "all 0.3s",
                }}
              >
                {index < currentStep ? <Check size={20} strokeWidth={3} /> : step.icon}
              </motion.div>

              <div
                style={{
                  marginTop: "0.75rem",
                  fontSize: "0.75rem",
                  fontWeight: isActive ? "800" : "600",
                  color: isActive ? "var(--teal-dark)" : "var(--gray-400)",
                  textAlign: "center",
                  lineHeight: "1.2",
                  transition: "all 0.3s",
                }}
              >
                {step.label}
              </div>

              {isCurrent && (
                <motion.div
                  layoutId="active-dot"
                  style={{ position: "absolute", bottom: "-10px", width: "6px", height: "6px", borderRadius: "50%", background: "var(--teal)" }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
