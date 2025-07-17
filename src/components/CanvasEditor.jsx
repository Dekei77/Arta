import { useState, useRef, useEffect } from "react";
import {
    Stage,
    Layer,
    Text,
    Rect,
    Circle,
    Line,
    Image as KonvaImage,
    Transformer
} from "react-konva";
import PropertyPanel from "./PropertyPanel";
import useImage from "use-image";
import * as pdfMake from "pdfmake/build/pdfmake";
import * as pdfFonts from "pdfmake/build/vfs_fonts";
import ReactJson from "react-json-view";

pdfMake.vfs = pdfFonts.vfs;

const sampleData = {
    new_field: "Иван Иванов",
    date_field: "10.07.2025",
    org_field: "ARta Group"
};

const ImageElement = ({ el, isSelected, onSelect, onDragEnd }) => {
    const [image] = useImage(el.src);
    return (
        <KonvaImage
            id={el.id}
            image={image}
            x={el.x}
            y={el.y}
            width={el.width}
            height={el.height}
            draggable
            onClick={() => onSelect(el.id)}
            onDragEnd={(e) => onDragEnd(e, el.id)}
            stroke={isSelected ? "red" : null}
            strokeWidth={isSelected ? 2 : 0}
        />
    );
};

const TransformerComponent = ({ selectedShapeName, onTransform }) => {
    const transformerRef = useRef();

    useEffect(() => {
        const stage = transformerRef.current?.getStage?.();
        const selectedNode = stage?.findOne(`#${selectedShapeName}`);
        if (selectedNode) {
            transformerRef.current.nodes([selectedNode]);
            transformerRef.current.getLayer().batchDraw();
        } else {
            transformerRef.current.nodes([]);
        }
    }, [selectedShapeName]);

    const handleTransformEnd = () => {
        const node = transformerRef.current.nodes()[0];
        if (!node) return;

        const changes = {
            id: selectedShapeName,
            x: node.x(),
            y: node.y(),
            rotation: node.rotation()
        };

        if (node.className === "Rect" || node.className === "Image") {
            changes.width = node.width() * node.scaleX();
            changes.height = node.height() * node.scaleY();
        }
        if (node.className === "Circle") {
            changes.radius = node.radius() * node.scaleX();
        }

        onTransform((prev) =>
            prev.map((el) => (el.id === selectedShapeName ? { ...el, ...changes } : el))
        );
    };

    return <Transformer ref={transformerRef} onTransformEnd={handleTransformEnd} />;
};

export default function CanvasEditor() {
    const [editMode, setEditMode] = useState("visual");
    const [elements, setElements] = useState([]);
    const [selectedId, setSelectedId] = useState(null);
    const [history, setHistory] = useState([]);
    const [future, setFuture] = useState([]);

    const selectedElement = elements.find((el) => el.id === selectedId);

    const commitChange = (newElements) => {
        const sorted = [...newElements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0));
        setHistory((prev) => [...prev, elements]);
        setElements(sorted);
        setFuture([]);
    };

    const changeZIndex = (id, direction) => {
        const updated = elements.map((el) =>
            el.id === id ? { ...el, zIndex: (el.zIndex || 0) + direction } : el
        );
        commitChange(updated);
    };

    const undo = () => {
        if (history.length === 0) return;
        const prev = history[history.length - 1];
        setHistory(history.slice(0, -1));
        setFuture([elements, ...future]);
        setElements(prev);
    };

    const redo = () => {
        if (future.length === 0) return;
        const next = future[0];
        setFuture(future.slice(1));
        setHistory([...history, elements]);
        setElements(next);
    };

    const updateElement = (updated) => {
        commitChange(elements.map((el) => (el.id === updated.id ? updated : el)));
    };

    const deleteElement = () => {
        if (!selectedId) return;
        commitChange(elements.filter((el) => el.id !== selectedId));
        setSelectedId(null);
    };

    const handleDragEnd = (e, id) => {
        const updated = elements.map((el) =>
            el.id === id ? { ...el, x: e.target.x(), y: e.target.y() } : el
        );
        commitChange(updated);
    };

    const addTextField = () => {
        const newId = `text-${elements.length + 1}`;
        commitChange([
            ...elements,
            {
                id: newId,
                type: "text",
                content: "{{new_field}}",
                x: 50,
                y: 100 + elements.length * 40,
                fontSize: 18,
                bold: false,
                draggable: true,
                zIndex: elements.length
            }
        ]);
    };

    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = () => {
            const newId = `img-${elements.length + 1}`;
            commitChange([
                ...elements,
                {
                    id: newId,
                    type: "image",
                    src: reader.result,
                    x: 100,
                    y: 100,
                    width: 150,
                    height: 150,
                    zIndex: elements.length
                }
            ]);
        };
        reader.readAsDataURL(file);
    };

    const addRect = () => {
        const newId = `rect-${elements.length + 1}`;
        commitChange([
            ...elements,
            {
                id: newId,
                type: "rect",
                x: 100,
                y: 100,
                width: 100,
                height: 60,
                fill: "#87ceeb",
                stroke: "#000000",
                strokeWidth: 1
            }
        ]);
    };

    const addCircle = () => {
        const newId = `circle-${elements.length + 1}`;
        commitChange([
            ...elements,
            {
                id: newId,
                type: "circle",
                x: 200,
                y: 200,
                radius: 40,
                fill: "#90ee90",
                stroke: "#000000",
                strokeWidth: 1
            }
        ]);
    };

    const addLine = () => {
        const newId = `line-${elements.length + 1}`;
        commitChange([
            ...elements,
            {
                id: newId,
                type: "line",
                points: [300, 300, 400, 300],
                stroke: "black",
                strokeWidth: 2,
                zIndex: elements.length
            }
        ]);
    };

    const A4_WIDTH = 595;
    const A4_HEIGHT = 842;

    const generatePDF = () => {
        const pdfContent = elements.map((el) => {
            if (el.type === "text") {
                const textWithData = el.content.replace(/\{\{(.*?)\}\}/g, (_, key) => sampleData[key.trim()] || "");
                return {
                    text: textWithData,
                    fontSize: el.fontSize || 12,
                    bold: el.bold || false,
                    absolutePosition: { x: el.x, y: el.y }
                };
            } else if (el.type === "rect") {
                return {
                    canvas: [{
                        type: "rect",
                        x: el.x,
                        y: el.y,
                        w: el.width,
                        h: el.height,
                        color: el.fill,
                        lineColor: el.stroke || "black",
                        lineWidth: el.strokeWidth || 1
                    }]
                };
            } else if (el.type === "circle") {
                return {
                    canvas: [{
                        type: "ellipse",
                        x: el.x,
                        y: el.y,
                        r1: el.radius,
                        r2: el.radius,
                        color: el.fill,
                        lineColor: el.stroke || "black",
                        lineWidth: el.strokeWidth || 1
                    }]
                };
            } else if (el.type === "line") {
                return {
                    canvas: [
                        {
                            type: "line",
                            x1: el.points[0],
                            y1: el.points[1],
                            x2: el.points[2],
                            y2: el.points[3],
                            lineWidth: el.strokeWidth || 1,
                            lineColor: el.stroke || "black"
                        }
                    ]
                };
            } else if (el.type === "image") {
                return {
                    image: el.src,
                    width: el.width,
                    height: el.height,
                    absolutePosition: { x: el.x, y: el.y }
                };
            }
            return null;
        }).filter(item => item !== null);

        pdfMake.createPdf({ content: pdfContent }).download("template.pdf");
    };

    return (
        <div style={{ display: "flex", height: "100vh", background: "#f0f0f0", width: "100vw" }}>
            {/* Боковая панель */}
            <div style={{ width: "250px", background: "#292f3b", color: "#ecf0f1", padding: "10px", borderRight: "1px solid #34495e" }}>
                <ul style={{ listStyle: "none", padding: 0, margin: 0 }}>
                    {["Форма сертификат", "Форма сертификата ЕАЭС", "Certificate of prod", "Certificate of serv", "Certificate products", "Declaration of conf", "Management, syster", "Отказ письма", "SBKTS", "expertise of precis", "learning of auditor", "Сертификат - БОСС", "Акты идентификац", "Деклараты выгр", "Декларация об об"].map((item, index) => (
                        <li key={index} style={{ padding: "5px", background: selectedId === `menu-${index}` ? "#34495e" : "transparent", cursor: "pointer", fontSize: "14px" }}
                            onClick={() => setSelectedId(`menu-${index}`)}>
                            {item}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Основная область */}
            <div style={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden", width: "calc(100% - 250px)" }}>
                <div style={{ background: "#373d49", color: "#ecf0f1", padding: "2px 10px", width: "100vw", display: "flex", alignItems: "center", justifyContent: "space-between", height: "30px", boxShadow: "0 2px 4px rgba(0,0,0,0.1)", position: "absolute", top: 0, left: 0, zIndex: 10 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "2px" }}>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>Приложение</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>Текст</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>KTRM</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>KTRM processes</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>Forms</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>Certification</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>Certificate of products...</span>
                        <span style={{ background: "#2c3e50", padding: "2px 6px", borderRadius: "2px", fontSize: "12px" }}>Форма сертификата...</span>
                    </div>
                    <button style={{ background: "#373d49", color: "#ecf0f1", border: "none", fontSize: "16px", cursor: "pointer" }}>⚙️</button>
                </div>
                <div style={{ flex: 1, display: "flex", padding: "10px", background: "#fff", marginTop: "30px" }}>
                    <div style={{ flex: 1, display: "flex", flexDirection: "column" }}>
                        <div style={{ marginBottom: "10px", display: "flex", flexWrap: "wrap", gap: "5px", alignItems: "center" }}>
                            <button onClick={() => setEditMode(editMode === "visual" ? "code" : "visual")} style={{ padding: "5px 10px", fontSize: "14px" }}>
                                {editMode === "visual" ? "🧾 Код" : "🖼️ Визуал"}
                            </button>
                            {editMode === "visual" && (
                                <>
                                    <button onClick={addTextField} style={{ padding: "5px 10px", fontSize: "14px" }}>➕ Текст</button>
                                    <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginLeft: "5px" }} />
                                    <button onClick={addRect} style={{ padding: "5px 10px", fontSize: "14px" }}>📦 Прямоугольник</button>
                                    <button onClick={addCircle} style={{ padding: "5px 10px", fontSize: "14px" }}>⚪ Круг</button>
                                    <button onClick={addLine} style={{ padding: "5px 10px", fontSize: "14px" }}>📏 Линия</button>
                                    <button onClick={undo} style={{ padding: "5px 10px", fontSize: "14px" }} disabled={history.length === 0}>↩ Undo</button>
                                    <button onClick={redo} style={{ padding: "5px 10px", fontSize: "14px" }} disabled={future.length === 0}>↪ Redo</button>
                                    {selectedId && (
                                        <>
                                            <button onClick={() => changeZIndex(selectedId, -1)} style={{ padding: "5px 10px", fontSize: "14px" }}>🔽 Назад</button>
                                            <button onClick={() => changeZIndex(selectedId, 1)} style={{ padding: "5px 10px", fontSize: "14px" }}>🔼 Вперёд</button>
                                        </>
                                    )}
                                </>
                            )}
                        </div>
                        {editMode === "visual" && (
                            <div style={{ marginBottom: "10px" }}>
                                <button onClick={generatePDF} style={{ padding: "5px 10px", background: "#4caf50", color: "white", fontSize: "14px", width: "100%" }}>📄 Экспорт в PDF</button>
                            </div>
                        )}
                        <div style={{ flex: 1, overflow: "auto", border: "1px solid #ccc" }}>
                            {editMode === "visual" ? (
                                <Stage width={A4_WIDTH} height={A4_HEIGHT}>
                                    <Layer>
                                        {[...elements].sort((a, b) => (a.zIndex || 0) - (b.zIndex || 0)).map((el) => {
                                            if (el.type === "text") {
                                                return (
                                                    <Text
                                                        key={el.id}
                                                        id={el.id}
                                                        text={el.content}
                                                        x={el.x}
                                                        y={el.y}
                                                        fontSize={el.fontSize}
                                                        fontStyle={el.bold ? "bold" : "normal"}
                                                        draggable
                                                        onClick={() => setSelectedId(el.id)}
                                                        onDragEnd={(e) => handleDragEnd(e, el.id)}
                                                        fill={selectedId === el.id ? "red" : "black"}
                                                    />
                                                );
                                            } else if (el.type === "image") {
                                                return (
                                                    <ImageElement
                                                        key={el.id}
                                                        el={el}
                                                        isSelected={selectedId === el.id}
                                                        onSelect={setSelectedId}
                                                        onDragEnd={handleDragEnd}
                                                    />
                                                );
                                            } else if (el.type === "rect") {
                                                return (
                                                    <Rect
                                                        key={el.id}
                                                        id={el.id}
                                                        x={el.x}
                                                        y={el.y}
                                                        width={el.width}
                                                        height={el.height}
                                                        fill={el.fill}
                                                        stroke={el.stroke || "black"}
                                                        strokeWidth={el.strokeWidth || 1}
                                                        draggable
                                                        onClick={() => setSelectedId(el.id)}
                                                        onDragEnd={(e) => handleDragEnd(e, el.id)}
                                                    />
                                                );
                                            } else if (el.type === "circle") {
                                                return (
                                                    <Circle
                                                        key={el.id}
                                                        id={el.id}
                                                        x={el.x}
                                                        y={el.y}
                                                        radius={el.radius}
                                                        fill={el.fill}
                                                        stroke={el.stroke || "black"}
                                                        strokeWidth={el.strokeWidth || 1}
                                                        draggable
                                                        onClick={() => setSelectedId(el.id)}
                                                        onDragEnd={(e) => handleDragEnd(e, el.id)}
                                                    />
                                                );
                                            } else if (el.type === "line") {
                                                return (
                                                    <Line
                                                        key={el.id}
                                                        id={el.id}
                                                        points={el.points}
                                                        stroke={el.stroke}
                                                        strokeWidth={el.strokeWidth}
                                                        draggable
                                                        onClick={() => setSelectedId(el.id)}
                                                        onDragEnd={(e) => handleDragEnd(e, el.id)}
                                                    />
                                                );
                                            }
                                            return null;
                                        })}
                                        <TransformerComponent
                                            selectedShapeName={selectedId}
                                            onTransform={setElements}
                                        />
                                    </Layer>
                                </Stage>
                            ) : (
                                <ReactJson
                                    src={elements}
                                    name={false}
                                    onEdit={({ updated_src }) => setElements(updated_src)}
                                    onAdd={({ updated_src }) => setElements(updated_src)}
                                    onDelete={({ updated_src }) => setElements(updated_src)}
                                    theme="monokai"
                                    collapsed={false}
                                />
                            )}
                        </div>
                    </div>
                </div>
            </div>

            {/* Панель свойств */}
            {selectedId && (
                <div style={{ width: "300px", background: "#fff", padding: "10px", borderLeft: "1px solid #ccc" }}>
                    <h3 style={{ margin: "0 0 10px" }}>Свойства</h3>
                    {selectedElement && (
                        <PropertyPanel
                            selectedElement={selectedElement}
                            onChange={updateElement}
                            onDelete={deleteElement}
                        />
                    )}
                </div>
            )}
        </div>
    );
}