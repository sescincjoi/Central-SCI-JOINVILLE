/* Blur reduzido no elemento protegido */
.auth-locked {
    filter: blur(3px) !important; /* Era 8px, agora 3px */
    pointer-events: none;
}

/* Overlay que cobre o elemento */
.auth-lock-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(255, 255, 255, 0.85);
    backdrop-filter: blur(2px);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 999;
    border-radius: inherit;
}

/* Card centralizado que se ajusta */
.auth-lock-message {
    background: white;
    padding: 24px;
    border-radius: 16px;
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    text-align: center;
    max-width: 90%;
    transition: all 0.2s ease;
}
