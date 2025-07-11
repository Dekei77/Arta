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
    setHistory((prev) => [...prev, elements]);
    setElements(newElements);
    setFuture([]);
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
        draggable: true
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
          height: 150
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
        fill: "#87ceeb"
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
        fill: "#90ee90"
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
        strokeWidth: 2
      }
    ]);
  };

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
          canvas: [
            {
              type: "rect",
              x: el.x,
              y: el.y,
              w: el.width,
              h: el.height,
              color: el.fill
            }
          ]
        };
      } else if (el.type === "circle") {
        return {
          canvas: [
            {
              type: "ellipse",
              x: el.x,
              y: el.y,
              r1: el.radius,
              r2: el.radius,
              color: el.fill
            }
          ]
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
      }
      return null;
    });

    pdfMake.createPdf({ content: pdfContent }).download("template.pdf");
  };

  return (
    <div style={{ display: "flex", padding: 20 }}>
      <div>
        <div style={{ marginBottom: 10 }}>
          <button onClick={() => setEditMode(editMode === "visual" ? "code" : "visual")}>
            {editMode === "visual" ? "🧾 Код" : "🖼️ Визуал"}
          </button>

          {editMode === "visual" && (
            <>
              <button onClick={addTextField}>➕ Текст</button>
              <input type="file" accept="image/*" onChange={handleImageUpload} style={{ marginLeft: 10 }} />
              <button onClick={addRect} style={{ marginLeft: 10 }}>📦 Прямоугольник</button>
              <button onClick={addCircle} style={{ marginLeft: 10 }}>⚪ Круг</button>
              <button onClick={addLine} style={{ marginLeft: 10 }}>📏 Линия</button>
              <button onClick={undo} style={{ marginLeft: 10 }} disabled={history.length === 0}>↩ Undo</button>
              <button onClick={redo} style={{ marginLeft: 5 }} disabled={future.length === 0}>↪ Redo</button>
              <button onClick={generatePDF} style={{ marginLeft: 10, background: "#4caf50", color: "white" }}>📄 Экспорт в PDF</button>
            </>
          )}
        </div>

        {editMode === "visual" ? (
          <Stage width={800} height={600} style={{ border: "1px solid #ccc", background: "#fff" }}>
            <Layer>
              {elements.map((el) => {
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
                      draggable
                      onClick={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                      stroke={selectedId === el.id ? "red" : "black"}
                      strokeWidth={selectedId === el.id ? 2 : 1}
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
                      draggable
                      onClick={() => setSelectedId(el.id)}
                      onDragEnd={(e) => handleDragEnd(e, el.id)}
                      stroke={selectedId === el.id ? "red" : "black"}
                      strokeWidth={selectedId === el.id ? 2 : 1}
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

      {editMode === "visual" && (
        <PropertyPanel
          selectedElement={selectedElement}
          onChange={updateElement}
          onDelete={deleteElement}
        />
      )}
    </div>
  );
}
