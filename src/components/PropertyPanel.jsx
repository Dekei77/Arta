export default function PropertyPanel({ selectedElement, onChange, onDelete }) {
  if (!selectedElement) return null;

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    onChange({
      ...selectedElement,
      [name]: type === "checkbox" ? checked : value
    });
  };

  const handleFieldInsert = (e) => {
    const field = e.target.value;
    if (!field) return;

    onChange({
      ...selectedElement,
      content: selectedElement.content + `{{${field}}}`,
    });
    e.target.value = ""; // сброс выбора
  };

  const availableFields = [
    "textbox_name",
    "textbox_bin",
    "textbox_legal_address",
    "listbox_region",
    "entity_signer",
  ];

  return (
    <div style={{ padding: "20px", width: "250px", borderLeft: "1px solid #ccc" }}>
      <h3>⚙ Свойства</h3>

      {selectedElement.type === "text" && (
        <>
          <label>Текст:</label>
          <input
            type="text"
            name="content"
            value={selectedElement.content}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>Размер шрифта:</label>
          <input
            type="number"
            name="fontSize"
            value={selectedElement.fontSize}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />

          <label>
            <input
              type="checkbox"
              name="bold"
              checked={!!selectedElement.bold}
              onChange={handleChange}
            />{" "}
            Жирный
          </label>

          <br />
          <br />
          <label>Добавить поле:</label>
          <select onChange={handleFieldInsert} style={{ width: "100%" }}>
            <option value="">Выберите поле...</option>
            {availableFields.map((f) => (
              <option key={f} value={f}>
                {f}
              </option>
            ))}
          </select>
        </>
      )}

      {selectedElement.type === "image" && (
        <>
          <label>Ширина:</label>
          <input
            type="number"
            name="width"
            value={selectedElement.width}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <label>Высота:</label>
          <input
            type="number"
            name="height"
            value={selectedElement.height}
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </>
      )}

      {selectedElement.type === "rect" && (
        <>
          <label>Ширина:</label>
          <input
            type="number"
            name="width"
            value={selectedElement.width}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <label>Высота:</label>
          <input
            type="number"
            name="height"
            value={selectedElement.height}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <label>Цвет заливки:</label>
          <input
            type="color"
            name="fill"
            value={selectedElement.fill}
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </>
      )}

      {selectedElement.type === "circle" && (
        <>
          <label>Радиус:</label>
          <input
            type="number"
            name="radius"
            value={selectedElement.radius}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <label>Цвет заливки:</label>
          <input
            type="color"
            name="fill"
            value={selectedElement.fill}
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </>
      )}

      {selectedElement.type === "line" && (
        <>
          <label>Цвет линии:</label>
          <input
            type="color"
            name="stroke"
            value={selectedElement.stroke}
            onChange={handleChange}
            style={{ width: "100%", marginBottom: "10px" }}
          />
          <label>Толщина:</label>
          <input
            type="number"
            name="strokeWidth"
            value={selectedElement.strokeWidth}
            onChange={handleChange}
            style={{ width: "100%" }}
          />
        </>
      )}

      <button
        style={{ marginTop: 20, background: "#e74c3c", color: "#fff", padding: 5, width: "100%" }}
        onClick={onDelete}
      >
        🗑️ Удалить элемент
      </button>
    </div>
  );
}
