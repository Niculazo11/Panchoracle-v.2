// Original aboutus.html stylesheet (responsive rules), split across files
// so no module goes over the line limit. The CSS itself is unchanged.
export const RESPONSIVE_CSS = `
/* --- Responsive: tablet (<=1024px) --- */
@media (max-width: 1024px) {
    section {
        max-width: 90%;
    }
}

/* --- Responsive: tablet/mobile (<=768px) --- */
@media (max-width: 768px) {
    nav ul {
        flex-wrap: wrap;
        gap: 12px;
        padding: 0 10px;
    }

    .hero {
        height: auto;
        padding: 30px 20px;
    }

    .hero h1 {
        font-size: 1.6rem;
    }

    .hero p {
        font-size: 0.95rem;
    }

    section {
        max-width: 92%;
        padding: 15px;
        margin: 15px auto;
    }
}

/* --- Responsive: mobile (<=480px) --- */
@media (max-width: 480px) {
    nav ul {
        flex-direction: column;
        align-items: center;
        gap: 8px;
    }

    nav {
        padding: 10px 0;
    }

    section {
        max-width: 100%;
        border-radius: 0;
    }
}
`;
