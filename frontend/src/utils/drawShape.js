// drawShape.js

export function drawShape(ctx, shape) {
  if (!ctx || !shape) return;

  const { type, x, y, width, height, radius, points, text } = shape;
  ctx.save()
  ctx.globalAlpha = shape.opacity ?? 1;
  
  ctx.beginPath();
  ctx.lineWidth = shape.strokeWidth || 2;
  ctx.strokeStyle = shape.color || "#000";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  const shapeType = type.toLowerCase();
  switch (shapeType) {
    case "rectangle":
      ctx.rect(x, y, width, height);
      
      if (shape.fill && shape.fill !== "transparent") {
        ctx.fillStyle = shape.fill;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case "circle":
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      
      if (shape.fill && shape.fill !== "transparent") {
        ctx.fillStyle = shape.fill;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case "line":
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
      if (shape.fill && shape.fill !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
      break;

    case "arrow": {
      // main line
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);

      // arrowhead
      const angle = Math.atan2(height, width);
      const headLength = 10;

      ctx.moveTo(x + width, y + height);
      ctx.lineTo(
        x + width - headLength * Math.cos(angle - Math.PI / 6),
        y + height - headLength * Math.sin(angle - Math.PI / 6)
      );
      ctx.moveTo(x + width, y + height);
      ctx.lineTo(
        x + width - headLength * Math.cos(angle + Math.PI / 6),
        y + height - headLength * Math.sin(angle + Math.PI / 6)
      );
      if (shape.fill && shape.fill !== "transparent") {
        ctx.fill();
      }
      ctx.stroke();
      break;
    }

    case "diamond":
      ctx.moveTo(x, y - height / 2);
      ctx.lineTo(x + width / 2, y);
      ctx.lineTo(x, y + height / 2);
      ctx.lineTo(x - width / 2, y);
      ctx.closePath();
      
      if (shape.fill && shape.fill !== "transparent") {
        ctx.fillStyle = shape.fill;
        ctx.fill();
      }
      ctx.stroke();
      break;

    case "freehand":
      if (points && points.length > 1) {
        // Curve through the midpoints, the same way the live preview is drawn in useCanvas.js,
        // so a stroke does not change shape when the pointer is released.
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length - 1; i++) {
          const midX = (points[i].x + points[i + 1].x) / 2;
          const midY = (points[i].y + points[i + 1].y) / 2;
          ctx.quadraticCurveTo(points[i].x, points[i].y, midX, midY);
        }
        const last = points[points.length - 1];
        ctx.lineTo(last.x, last.y);
        if (shape.fill && shape.fill !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      }
      break;

    case "text":
      ctx.font = `${shape.fontSize || 16}px Arial`;
      ctx.fillStyle = shape.color || "black";
      ctx.fillText(text || "", x, y);
      if (shape.fill && shape.fill !== "transparent") {
        ctx.fill();
      }
      break;

    case "eraser": 
      if(points && points.length > 1){
        ctx.strokeStyle = shape.color || "#ffffff";
        ctx.lineWidth = shape.strokeWidth || 10;
        ctx.lineCap = "round";

        ctx.beginPath();
        ctx.moveTo(points[0].x, points[0].y);
        for(let i=1; i< points.length; i++){
          ctx.lineTo(points[i].x, points[i].y);
        }
        if (shape.fill && shape.fill !== "transparent") {
          ctx.fill();
        }
        ctx.stroke();
      }
      break;

    default:
      console.warn("Unknown shape type:", type, shape);
  }

  ctx.closePath();
  ctx.restore();
}
