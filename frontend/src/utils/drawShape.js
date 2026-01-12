export const drawShape = (ctx, shape) => {
    if(!shape || !ctx || !shape.type) return;
    const { startPos } = shape;

    const type = shape.type.toLowerCase();
    const x = shape.x ?? shape.startPos?.x;
    const y = shape.y ?? shape.startPos?.y;
    const width = shape.width ?? (shape.endPos?.x - shape.startPos?.x);
    const height = shape.height ?? (shape.endPos?.y - shape.startPos?.y);

    // console.log("drawing shape: ", shape);
    // console.log("on ctx: ", ctx);
    
    switch(type) {
        case "circle": {
            const radius = Math.sqrt(Math.pow(width, 2) + Math.pow(height, 2));
            
            ctx.beginPath();
            ctx.arc(x, y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        }

        case "rectangle": {
            const wid = width;
            const hei = height;
            ctx.beginPath();
            ctx.strokeRect(x, y, wid, hei);
            break;
        }

        case "diamond": {
            const midX = (x + x + width) / 2;
            const midY = (y + y + height) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, y);
            ctx.lineTo(x + width, midY);
            ctx.lineTo(midX, y + height);
            ctx.lineTo(x, midY);
            ctx.closePath();
            ctx.stroke();
            break;
        }

        case "line": {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y + height);
            ctx.stroke();
            break;
        }

        case "pencil": {
            const pts = shape.points || [];
            if(pts.length < 2) return ;

            ctx.beginPath();
            ctx.strokeStyle = shape.color || "#000000";
            ctx.lineWidth = shape.lineWidth || 2;
            ctx.lineCap = "round";
            ctx.lineJoin = "round";

            ctx.moveTo(pts[0].x, pts[0].y);
            for(let i=1; i<pts.length; i++) {
                ctx.lineTo(pts[i].x, pts[i].y);
            }

            ctx.stroke();
            break;
        }

        case "arrow": {
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x + width, y + height);
            ctx.stroke();

            const arrowHeadLength = 15; // length of head in pixels
            const arrowHeadAngle = Math.PI / 6; // 30 degrees
            const angle = Math.atan2(height, width);

            const arrowPoint1X = x + width - arrowHeadLength * Math.cos(angle - arrowHeadAngle);
            const arrowPoint1Y = y + height - arrowHeadLength * Math.sin(angle - arrowHeadAngle);
            const arrowPoint2X = x + width - arrowHeadLength * Math.cos(angle + arrowHeadAngle);
            const arrowPoint2Y = y + height - arrowHeadLength * Math.sin(angle + arrowHeadAngle);
            
            ctx.beginPath();
            ctx.moveTo(x + width, y + height);
            ctx.lineTo(arrowPoint1X, arrowPoint1Y);
            ctx.moveTo(x + width, y + height);
            ctx.lineTo(arrowPoint2X, arrowPoint2Y);
            ctx.stroke();
            break;
        }

        case "text": {
            const text = shape.text || "";
            const fontSize = shape.fontSize || 20;
            const fontFamily = "Arial";

            ctx.font = `${fontSize}px ${fontFamily}`;
            ctx.textBaseline = "middle";

            ctx.fillText(text, x, y);

            if(shape.isEditing){
                const  textWidth = ctx.measureText(text).width;
                ctx.beginPath();

                ctx.moveTo(x + textWidth + 2, y);
                ctx.lineTo(startPos.x + textWidth + 2, y + fontSize);
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            break;
        }

        case "eraser": {
            // Draw eraser cursor visualization
            const eraserSize = shape.size || 20; // Default size 20
            const erasePath = shape.points || [];

           // Draw the eraser path (trail showing where eraser moved)
            if (erasePath.length > 1) {
                ctx.beginPath();
                ctx.moveTo(erasePath[0].x, erasePath[0].y);
                for (let i = 1; i < erasePath.length; i++) {
                    ctx.lineTo(erasePath[i].x, erasePath[i].y);
                }
                ctx.strokeStyle = "rgba(255, 0, 0, 0.3)"; // Semi-transparent red trail
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            // 2. Draw the circle cursor at the current position (last point in array)
            const currentPos = erasePath.length > 0 ? erasePath[erasePath.length - 1] : shape.startPos;
            if (currentPos) {
                ctx.beginPath();
                ctx.arc(currentPos.x, currentPos.y, eraserSize, 0, 2 * Math.PI);
                ctx.strokeStyle = "#ff0000";
                ctx.stroke();
            }
            break;
        }

        default:
            break;
    }

    ctx.closePath();
}