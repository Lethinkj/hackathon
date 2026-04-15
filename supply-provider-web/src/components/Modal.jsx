export default function Modal({ open, onClose, children }) {
    return (
        <div className={`modal-overlay ${open ? 'open' : ''}`} onClick={onClose}>
            <div className="modal" onClick={(event) => event.stopPropagation()}>
                {children}
            </div>
        </div>
    )
}
