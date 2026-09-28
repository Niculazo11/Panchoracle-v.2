// Original aboutus.html stylesheet (layout rules), split across files
// so no module goes over the line limit. The CSS itself is unchanged.
export const LAYOUT_CSS = `
nav {
    background-color: rgb(106, 158, 201);
    width: 100%;
    padding: 15px 0;
    border: 2px solid rgb(106, 158, 201);
}

nav ul {
    display: flex;
    justify-content: center;
    margin: 0;
    gap: 30px;

}

nav a {
    text-decoration: none;
    color:rgb(14, 12, 12);
    font-weight: bold;
}

nav a:hover {
    text-decoration: underline;
}

.hero{
    background-image:
linear-gradient(rgba(152, 178, 233, 0.4), rgba(152, 183, 223, 0.4)),
url("/images/herooff.jpg");
    background-color:rgb(201, 224, 236);
    background-size: cover;
    background-position: center;
    height: 300px;

    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;

    color:rgb(15, 15, 15);
    text-align: center;
}
#faq article p {
        text-align: left;
        display: none;
    }

    #faq article p:target {
        display: block;
    }
`;
