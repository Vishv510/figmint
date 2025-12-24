import { CanvasProvider } from '../context/CanvasContext'
// Import your AuthProvider here
import { AuthProvider } from '../context/AuthContext' 
import  Canvas from './Canvas' 

function CreateCanvas() {
  return (
    <>
      {/* AuthProvider must be outside to provide context to the Header inside CreateCanvas */}
      <AuthProvider>
        <CanvasProvider>
          <Canvas />
        </CanvasProvider>
      </AuthProvider>
    </>
  )
}

export default CreateCanvas;