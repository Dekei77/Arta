import React from "react";

export default function CanvasIDEWrapper({ children }) {
  return (
    <div style={{ display: "flex", height: "100vh", fontFamily: "sans-serif" }}>
      {/* Левая панель как в IDE */}
      <div style={{ width: 220, background: "#1e1e1e", color: "#ccc", padding: 10 }}>
        <div style={{ color: "#fff", fontWeight: "bold", marginBottom: 10 }}>workflow</div>
        <div style={{ marginLeft: 10 }}>📁 forms</div>
        <div style={{ marginLeft: 20 }}>📄 Certification</div>
        <div style={{ marginLeft: 20 }}>📄 canvas_template.js</div>
      </div>

      {/* Основная область */}
      <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
        {/* Верхняя вкладка */}
        <div style={{ background: "#2d2d2d", color: "#eee", padding: "6px 12px", fontSize: 14 }}>
          canvas_template.js
        </div>

        {/* Основной контент */}
        <div style={{ flex: 1, background: "#fefefe", overflow: "auto", padding: 10 }}>
          {children}
        </div>
      </div>
    </div>
  );
}
