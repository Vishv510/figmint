export const drawShape = (ctx, shape) => {
    if(!shape || !ctx) return;
    const { type, endPos, startPos } = shape;

    console.log("drawing shape: ", shape);
    console.log("on ctx: ", ctx);
    
    switch(type) {
        case "circle": {
            const radius = Math.sqrt(Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - endPos.y, 2));
            
            ctx.beginPath();
            ctx.arc(startPos.x, startPos.y, radius, 0, 2 * Math.PI);
            ctx.stroke();
            break;
        }

        case "rectangle": {
            const width = endPos.x - startPos.x;
            const height = endPos.y - startPos.y;
            ctx.beginPath();
            ctx.strokeRect(startPos.x, startPos.y, width, height);
            break;
        }

        case "diamond": {
            const midX = (startPos.x + endPos.x) / 2;
            const midY = (startPos.y + endPos.y) / 2;
            ctx.beginPath();
            ctx.moveTo(midX, startPos.y);
            ctx.lineTo(endPos.x, midY);
            ctx.lineTo(midX, endPos.y);
            ctx.lineTo(startPos.x, midY);
            ctx.closePath();
            ctx.stroke();
            break;
        }

        case "line": {
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(endPos.x, endPos.y);
            ctx.stroke();
            break;
        }

        case "pencil": {
            console.log("drawing pencil with points: ", endPos);
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            for (let point of endPos) {
                ctx.lineTo(point.x, point.y);
            }
            ctx.stroke();
            break;
        }

        case "arrow": {
            ctx.beginPath();
            ctx.moveTo(startPos.x, startPos.y);
            ctx.lineTo(endPos.x, endPos.y);
            ctx.stroke();

            const arrowHeadLength = 15; // length of head in pixels
            const arrowHeadAngle = Math.PI / 6; // 30 degrees
            const angle = Math.atan2(endPos.y - startPos.y, endPos.x - startPos.x);

            const arrowPoint1X = endPos.x - arrowHeadLength * Math.cos(angle - arrowHeadAngle);
            const arrowPoint1Y = endPos.y - arrowHeadLength * Math.sin(angle - arrowHeadAngle);
            const arrowPoint2X = endPos.x - arrowHeadLength * Math.cos(angle + arrowHeadAngle);
            const arrowPoint2Y = endPos.y - arrowHeadLength * Math.sin(angle + arrowHeadAngle);
            
            ctx.beginPath();
            ctx.moveTo(endPos.x, endPos.y);
            ctx.lineTo(arrowPoint1X, arrowPoint1Y);
            ctx.moveTo(endPos.x, endPos.y);
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

            ctx.fillText(text, startPos.x, startPos.y);

            if(shape.isEditing){
                const  textWidth = ctx.measureText(text).width;
                ctx.beginPath();

                ctx.moveTo(startPos.x + textWidth + 2, startPos.y);
                ctx.lineTo(startPos.x + textWidth + 2, startPos.y + fontSize);
                ctx.strokeStyle = "#000000";
                ctx.lineWidth = 1;
                ctx.stroke();
            }
            break;
        }

        case "eraser": {
            // Draw eraser cursor visualization
            const eraserSize = shape.size || 20; // Default size 20
            const x = endPos.x;
            const y = endPos.y;
            const erasePath = shape.erasePath || [];

            const originalStrokeStyle = ctx.strokeStyle;
            const originalLineWidth = ctx.lineWidth;

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

            // Draw outer circle at current position
            ctx.beginPath();
            ctx.arc(x, y, eraserSize, 0, 2 * Math.PI);
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 2;
            ctx.stroke();

            // Draw crosshair
            ctx.beginPath();
            ctx.moveTo(x - eraserSize, y);
            ctx.lineTo(x + eraserSize, y);
            ctx.moveTo(x, y - eraserSize);
            ctx.lineTo(x, y + eraserSize);
            ctx.strokeStyle = "#ff0000";
            ctx.lineWidth = 1;
            ctx.stroke();

            // Draw center dot
            ctx.beginPath();
            ctx.arc(x, y, 2, 0, 2 * Math.PI);
            ctx.fillStyle = "#ff0000";
            ctx.fill();

            // Restore original styles
            ctx.strokeStyle = originalStrokeStyle;
            ctx.lineWidth = originalLineWidth;
            break;
        }

        default:
            break;
    }

    ctx.closePath();
}