import React, { useEffect, useId, useRef } from 'react';
import { X } from 'lucide-react';

export default function Dialog({ title, description, busy = false, onClose, children }) {
    const ref = useRef(null);
    const titleId = useId();
    const descriptionId = useId();
    useEffect(() => {
        const dialog = ref.current;
        const previousFocus = document.activeElement;
        dialog.showModal();
        dialog.querySelector('input, select')?.focus();
        return () => {
            dialog.close();
            previousFocus?.focus();
        };
    }, []);
    return (
        <dialog
            ref={ref}
            className="app-dialog"
            aria-labelledby={titleId}
            aria-describedby={description ? descriptionId : undefined}
            onCancel={(event) => {
                event.preventDefault();
                if (!busy) onClose();
            }}
        >
            <div className="dialog-heading">
                <div>
                    <p className="eyebrow">Asiste</p>
                    <h2 id={titleId}>{title}</h2>
                </div>
                <button
                    type="button"
                    className="icon-button"
                    disabled={busy}
                    aria-label="Cerrar formulario"
                    onClick={onClose}
                >
                    <X size={20} />
                </button>
            </div>
            {description && (
                <p className="dialog-description" id={descriptionId}>
                    {description}
                </p>
            )}
            {children}
        </dialog>
    );
}
