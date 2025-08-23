export const drawRectangle = (ctx, shape) => {
  const { x1, y1, x2, y2 } = shape;
  ctx.beginPath();
  ctx.rect(x1, y1, x2 - x1, y2 - y1);
  ctx.stroke();
};

export const drawLine = (ctx, shape) => {
  const { x1, y1, x2, y2 } = shape;
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
};

export const drawCircle = (ctx, shape) => {
  const { x1, y1, x2, y2 } = shape;
  const r = Math.hypot(x2 - x1, y2 - y1);
  ctx.beginPath();
  ctx.arc(x1, y1, r, 0, Math.PI * 2);
  ctx.stroke();
};

export const drawPencil = (ctx, shape) => {
  const { points = [] } = shape;
  if (points.length < 2) return;
  ctx.beginPath();
  ctx.moveTo(points[0].x, points[0].y);
  for (let i = 1; i < points.length; i++) {
    ctx.lineTo(points[i].x, points[i].y);
  }
  ctx.stroke();
};

export const drawText = (ctx, shape) => {
  const { x1, y1, text } = shape;
  ctx.fillText(text || "", x1, y1);
};

export const drawShape = (ctx, shape) => {
  switch (shape.type) {
    case "rectangle":
      return drawRectangle(ctx, shape);
    case "line":
      return drawLine(ctx, shape);
    case "circle":
      return drawCircle(ctx, shape);
    case "pencil":
      return drawPencil(ctx, shape);
    case "text":
      return drawText(ctx, shape);
    default:
      return;
  }
};
