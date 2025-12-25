import {  useRef } from 'react'
import { useCanvas } from '../hooks/useCanvas';
import { Header } from '../components/Header';
import { BottomToolbar } from '../components/Bottom';

function Canvas () {
    const mainCanvasRef = useRef(null);
    const tempCanvasRef = useRef(null);
    
    // The hook now handles its own WebSocket initialization internally
    const { handleMouseDown, handleMouseMove, handleMouseUp, handleWheel } = useCanvas(mainCanvasRef, tempCanvasRef);

    return (
        <div className='relative w-screen h-screen overflow-hidden bg-white'>
            <Header />
            
            <div className="relative flex-1 h-[calc(100vh-120px)]">
                <canvas 
                    ref={mainCanvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className="absolute inset-0 z-0"
                />
                <canvas 
                    ref={tempCanvasRef}
                    width={window.innerWidth}
                    height={window.innerHeight}
                    className="absolute inset-0 z-10 touch-none cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onWheel={handleWheel}
                />
            </div>

            {/* <BottomToolbar /> */}
        </div>
    )
}

export default Canvas;