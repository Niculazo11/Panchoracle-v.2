// Original aboutus.html stylesheet (base rules), split across files
// so no module goes over the line limit. The CSS itself is unchanged.
export const BASE_CSS = `
body {
    font-family: Arial, sans-serif;
    margin: 0;
    padding: 0;
    background-color: #91b7ce;
}

h1 {
    text-align: center;
    color: #000000;
}

h2{
    text-align: center;
    color: #000000;
}

p {
    text-align: center;
    color: #050505;
}

ul {
    list-style-type: none;
    padding: 0;
    text-align: center;
}

li {
    display: inline-block;
    margin: 0 10px;
}

a {
    text-decoration: none;
    color: #007BFF;
}

a:hover {
    text-decoration: underline;
}

section {
    padding: 20px;
    margin: 20px auto;
    max-width: 800px;
    background-color: #c5cef5;
    border-radius: 8px;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}
`;
