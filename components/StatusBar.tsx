"use client";

import { useEffect, useState } from "react";

export function StatusBar() {
  const [time, setTime] = useState<string>("9:41");

  useEffect(() => {
    const update = () => {
      const d = new Date();
      const h = d.getHours();
      const m = d.getMinutes().toString().padStart(2, "0");
      setTime(`${h}:${m}`);
    };
    update();
    const id = setInterval(update, 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="status-bar">
      <span>{time}</span>
      <span className="center">
        CONTINUUM<em> · </em>LIVING
      </span>
      <span aria-hidden />
    </div>
  );
}
