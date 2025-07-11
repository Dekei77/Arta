import CanvasEditor from "./components/CanvasEditor";

function App() {
  return (
    <div>
      <div style={{ display: "flex", alignItems: "center", gap: "12px", padding: "10px" }}>
        <img
          src="/logo-arta.jpg" // Файл должен быть в папке `public`
          alt="Arta Logo"
          style={{ height: 50 }}
        />
        <h1 style={{ margin: 0 }}>PDF Template Editor</h1>
      </div>

      <CanvasEditor />
    </div>
  );
}

export default App;
