// drawShape.js

export function drawShape(ctx, shape) {
  if (!ctx || !shape) return;

  const { type, x, y, width, height, radius, points, text } = shape;

  ctx.beginPath();
  ctx.lineWidth = shape.strokeWidth || 2;
  ctx.strokeStyle = shape.color || "#000";
  ctx.fillStyle = shape.fill || "transparent";

  const shapeType = type.toLowerCase();
  switch (shapeType) {
    case "rectangle":
      ctx.rect(x, y, width, height);
      ctx.fill();
      ctx.stroke();
      break;

    case "circle":
      ctx.arc(x, y, radius, 0, 2 * Math.PI);
      ctx.fill();
      ctx.stroke();
      break;

    case "line":
      ctx.moveTo(x, y);
      ctx.lineTo(x + width, y + height);
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
      ctx.stroke();
      break;
    }

    case "diamond":
      ctx.moveTo(x, y - height / 2);
      ctx.lineTo(x + width / 2, y);
      ctx.lineTo(x, y + height / 2);
      ctx.lineTo(x - width / 2, y);
      ctx.closePath();
      ctx.fill();
      ctx.stroke();
      break;

    case "freehand":
      if (points && points.length > 1) {
        ctx.moveTo(points[0].x, points[0].y);
        for (let i = 1; i < points.length; i++) {
          ctx.lineTo(points[i].x, points[i].y);
        }
        ctx.stroke();
      }
      break;

    case "text":
      ctx.font = `${shape.fontSize || 16}px Arial`;
      ctx.fillStyle = shape.color || "black";
      ctx.fillText(text || "", x, y);
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

        ctx.stroke();
      }
      break;

    default:
      console.warn("Unknown shape type:", type, shape);
  }

  ctx.closePath();
}
