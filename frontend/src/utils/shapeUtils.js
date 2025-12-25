export const isPointInShape = (px, py, shape, tolerance = 10, eraserSize) => { 
    const { startPos, endPos = startPos } = shape; 
    
    const type = shape.type?.toLowerCase();
    
    // Normalize coordinates: Use database properties or start/end positions
    const x = shape.x ?? shape.startPos?.x;
    const y = shape.y ?? shape.startPos?.y;
    const w = shape.width ?? (shape.endPos? shape.endPos.x - shape.startPos.x : 0);
    const h = shape.height ?? (shape.endPos? shape.endPos.y - shape.startPos.y : 0);
    
    switch(type) { 
        case "rectangle": { 
            const minX = Math.min(x, x + w) - tolerance; 
            const maxX = Math.max(x, x + w) + tolerance; 
            const minY = Math.min(y, y + h) - tolerance; 
            const maxY = Math.max(y, y + h) + tolerance; 
            return px >= minX && px <= maxX && py >= minY && py <= maxY; 
        } 
        case "circle": { 
            const radius = shape.radius || Math.sqrt( w * w + h * h ); 
            const distance = Math.sqrt( Math.pow(px - x, 2) + Math.pow(py - y, 2) ); 
            return distance <= radius + tolerance; 
        } 
        case "line": 
        case "arrow": { 
            // Distance from point to line segment 
            const dist = distanceToLineSegment(px, py, startPos, endPos); 
            return dist <= tolerance; 
        } case "diamond": { 
            // Check if point is inside diamond bounds 
            const minX = Math.min(x, x + w) - tolerance; 
            const maxX = Math.max(x, x + w) + tolerance; 
            const minY = Math.min(y, y + h) - tolerance; 
            const maxY = Math.max(y, y + h) + tolerance; 
            return px >= minX && px <= maxX && py >= minY && py <= maxY; 
        } 

        case "freehand":
        case "pencil": { 
            // Fix: Use shape.points instead of endPos for pencil array
            const pts = shape.points || [];
            for (let i = 0; i < pts.length - 1; i++) { 
                const dist = distanceToLineSegment(px, py, pts[i], pts[i + 1]); 
                if (dist <= tolerance) return true; 
            } 
            return false; 
        }
        case "text": { 
            const {  text, fontSize = 20 } = shape; 
            // Create a temporary canvas context to measure text width 
            // // const tempCanvas = document.createElement("canvas"); 
            // // const tempCtx = tempCanvas.getContext("2d");
            //  // tempCtx.font = ${fontSize}px Arial; 
            // // const textWidth = tempCtx.measureText(text || "").width; 
            // // const textHeight = fontSize; // approximate height // Estimate text width (roughly 0.6 × fontSize × number of chars) 
            const textWidth = text.length * fontSize * 0.6; 
            const textHeight = fontSize; 
            const buffer = eraserSize || 10; 
            return ( px >= x - buffer && px <= x + textWidth + buffer && py >= y - textHeight - buffer && py <= y + buffer ); 
        } 
        default: return false; 
    } 
};

const distanceToLineSegment = (px, py, p1, p2) => { 
    if (!p1 || !p2 || p1.x === undefined || p2.x === undefined) {
        return Infinity; 
    }
    const l2 = Math.pow(p2.x - p1.x, 2) + Math.pow(p2.y - p1.y, 2);
    if (l2 === 0) return Math.sqrt(Math.pow(px - p1.x, 2) + Math.pow(py - p1.y, 2));
    
    let t = ((px - p1.x) * (p2.x - p1.x) + (py - p1.y) * (p2.y - p1.y)) / l2;
    t = Math.max(0, Math.min(1, t));
    
    const closestX = p1.x + t * (p2.x - p1.x);
    const closestY = p1.y + t * (p2.y - p1.y);
    
    return Math.sqrt(Math.pow(px - closestX, 2) + Math.pow(py - closestY, 2));
};