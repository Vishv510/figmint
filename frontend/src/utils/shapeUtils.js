export const isPointInShape = (x, y, shape, tolerance = 10, eraserSize) => { 
    const { type, startPos, endPos = startPos } = shape; 
    switch(type) { 
        case "rectangle": { 
            const minX = Math.min(startPos.x, endPos.x) - tolerance; 
            const maxX = Math.max(startPos.x, endPos.x) + tolerance; 
            const minY = Math.min(startPos.y, endPos.y) - tolerance; 
            const maxY = Math.max(startPos.y, endPos.y) + tolerance; 
            return x >= minX && x <= maxX && y >= minY && y <= maxY; 
        } 
        case "circle": { 
            const radius = Math.sqrt( Math.pow(endPos.x - startPos.x, 2) + Math.pow(endPos.y - startPos.y, 2) ); 
            const distance = Math.sqrt( Math.pow(x - startPos.x, 2) + Math.pow(y - startPos.y, 2) ); 
            return distance <= radius + tolerance; 
        } 
        case "line": 
        case "arrow": { 
            // Distance from point to line segment 
            const dist = distanceToLineSegment(x, y, startPos, endPos); 
            return dist <= tolerance; 
        } case "diamond": { 
            // Check if point is inside diamond bounds 
            const minX = Math.min(startPos.x, endPos.x) - tolerance; 
            const maxX = Math.max(startPos.x, endPos.x) + tolerance; 
            const minY = Math.min(startPos.y, endPos.y) - tolerance; 
            const maxY = Math.max(startPos.y, endPos.y) + tolerance; 
            return x >= minX && x <= maxX && y >= minY && y <= maxY; 
        } 
        case "pencil": { 
            // Fix: Use shape.points instead of endPos for pencil array
            const pts = shape.points || [];
            for (let i = 0; i < pts.length - 1; i++) { 
                const dist = distanceToLineSegment(x, y, pts[i], pts[i + 1]); 
                if (dist <= tolerance) return true; 
            } 
            return false; 
        }
        case "text": { 
            const { startPos, text, fontSize = 20 } = shape; 
            // Create a temporary canvas context to measure text width 
            // // const tempCanvas = document.createElement("canvas"); 
            // // const tempCtx = tempCanvas.getContext("2d");
            //  // tempCtx.font = ${fontSize}px Arial; 
            // // const textWidth = tempCtx.measureText(text || "").width; 
            // // const textHeight = fontSize; // approximate height // Estimate text width (roughly 0.6 × fontSize × number of chars) 
            const textWidth = text.length * fontSize * 0.6; 
            const textHeight = fontSize; 
            const buffer = eraserSize || 10; 
            return ( x >= startPos.x - buffer && x <= startPos.x + textWidth + buffer && y >= startPos.y - textHeight - buffer && y <= startPos.y + buffer ); 
        } 
        default: return false; 
    } 
};

const distanceToLineSegment = (px, py, p1, p2) => { 
    const A = px - p1.x; 
    const B = py - p1.y; 
    const C = p2.x - p1.x; 
    const D = p2.y - p1.y; 
    const dot = A * C + B * D; 
    const lenSq = C * C + D * D; 
    let param = -1; 
    
    if (lenSq !== 0) { 
        param = dot / lenSq; 
    } 
    let xx, yy; 
    if (param < 0) { 
        xx = p1.x; yy = p1.y; 
    } else if (param > 1) { 
        xx = p2.x; yy = p2.y; 
    } else { 
        xx = p1.x + param * C; yy = p1.y + param * D; 
    } 
    
    const dx = px - xx; 
    const dy = py - yy; 
    return Math.sqrt(dx * dx + dy * dy); 
};