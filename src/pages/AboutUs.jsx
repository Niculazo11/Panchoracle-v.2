import { useEffect } from "react";

// The original aboutus.html used a plain <style> block (not Tailwind)
// with page-wide selectors (body, h1, h2, p, nav, section...). Since
// this is now one page among several in a single-page app sharing one
// <head>, that stylesheet is injected on mount and removed on unmount
// so it never leaks onto other routes -- the CSS rules themselves are
// unchanged from the original.
const ABOUT_US_STYLES = `
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

const FAQ_ITEMS = [
    {
        id: "answer1",
        question: "How to change my password?",
        answer: (
            <>
                On the “PROFILE” section, you will have to enter into the option that says “Change my password”
                and then it will ask you to digit your previous password to check that it is the correct user of
                the respective account. After the validation, you will have to digit a new password and in the box below
                it will tell you to write the password again in case you commit a spelling mistake. Dont abandon your Pancho, so take care of your password.
            </>
        )
    },
    {
        id: "answer2",
        question: "How do i obtain coins?",
        answer: "You can obtain various amounts of coins just by playing the different minigames the website offers. By each minigame completed you will receive +5 coins, to play the minigames you can go to the page where do you have the Pancho and click the button that says minigames."
    },
    {
        id: "answer3",
        question: "How the shop works?",
        answer: 'You can spend your coins in this shop, to acces it you can go to the page where is your Pancho and then click the button that says "Cosmetic shop". There you will be able to buy any available cosmetic to put it on your Pancho, Pancho would appreciate your fashion sense.'
    },
    {
        id: "answer4",
        question: "How the achievements section works?",
        answer: "You will be achievieng some achievements just by completing the homeworks and playing the minigames. This achievements will record your progress trhough your journey with Pancho, and when you complete the 100% of the progress this will give you +10 coins. Each achievement will focus on something different, some are you to complete a certain number of minigames, other for you to complete most of your homeworks, and others are for completing with a perfect grade your homeworks. Make yourself rich by showing how smart you are."
    },
    {
        id: "answer5",
        question: "How the minigames work?",
        answer: 'The minigames are some events where you can play to obtain coins. These are very short in order you can complete them anytime you want, and will focus on aid your study by being academic minigames. These minigames can be various, going since "find the pair" memory game, some quick quiz, match the concept between others, make sure yourself to make Pancho fell bonita.'
    },
    {
        id: "answer6",
        question: "How do i mantain alive my Pancho?",
        answer: 'Pancho is a very sensitive animal, and one with a great responsibility sense on it. It will only feed himself if you complete your obligatory homeworks, the happines and hunger meter on Pancho will indicate your grade, so dont forget to complete your homeworks. Pancho also will feed depending on the score you get in the homework. You can acces to your homeworks by entering to the button that says "Feed Pancho" in the page where your Pancho is.'
    },
    {
        id: "answer7",
        question: "What happens if i dont feed my Pancho?",
        answer: "If you dont feed Pancho whit enough homeworks done, then shamely Pancho will have a very very long sleep due to the starving. When this happens your teacher will not be happy and will grade you with a bad score, Pancho's hunger meter will restart each academic semester. So dont let the poor Pancho starving."
    },
    {
        id: "answer8",
        question: "How many homeworks do i have to do to mantain Pancho happy?",
        answer: "The amount of homeworks depends merely on your teacher, because he is who create and add the assignments to the website. So be sure to ask frequently your teachers when you have to handle the homework."
    },
    {
        id: "answer9",
        question: "How can I reasign the homework deadline?",
        answer: 'In case you are a teacher, you can reasign the homeworks deadlin just by entering in the "Assignments" button on the dog park section, there you will have the homeworks you have asigned, and next to it will be a box that says "Reasign", you click in there, and then change your students deadlines.'
    },
    {
        id: "answer10",
        question: "How can I asign the homework to my students?",
        answer: 'In case you are a teacher, you can asign homeworks just by entering in the "Assignments" button on the dog park section, there you will have the homeworks you have already asigned and their deadline, on the top will be a blue button that says "Asign homework" where you can put the specifications and the required resources for the students to complete the homework. The website will not create the homework for you, but will help you receive all the homeworks like documents or images.'
    },
    {
        id: "answer11",
        question: "How can I change the group of students to grade?",
        answer: "In case you are a teacher, you can change your group of students just by entering in the \"Group\" button on the dog park section, there you will have a list of all the groups you have, each group is named by you. When you change of group, you can see the Pancho of each student, and also the homeworks of thar group in specific."
    }
];

export default function AboutUs() {

    useEffect(() => {
        const style = document.createElement("style");
        style.id = "aboutus-page-styles";
        style.textContent = ABOUT_US_STYLES;
        document.head.appendChild(style);

        return () => {
            document.head.removeChild(style);
        };
    }, []);

    return (
        <>
            <nav>
                <ul>
                    <li><a href="#About">About Us</a></li>
                    <li><a href="#problematic">Problem Statement</a></li>
                    <li><a href="#objectives">Project Objectives</a></li>
                    <li><a href="#figma">Figma Wireframe</a></li>
                </ul>
            </nav>

            <section className="hero">
                <h1>GROW A PANCHO</h1>
                <p>Welcome to the GROW A PANCHO website! We are a website focused on aid the autonomous learning of the students by various minigames, ways to leave homeworks to the students, and cosmetic incentives. Pancho is a good dog! he will eat and be happy as long as you do your homeworks and will tell your teacher to put you a good grade; but if he is starving and unhappy he will tell your teacher to put a bad grade on you, be aware!.</p>
            </section>

            <section id="About">
                <h2>About Us</h2>
                <p>As an independant group, we are looking for a tool that will facilitate
                    study sessions and the way of teaching students in an interactive manner
                    that will motivate them to work autonomously. We will be differentiated
                    from the others considering that our web will not only be an online
                    learning tool to share assignments, rather an interactive tool to post
                    assignments that also serves as a way to post various minigames with a
                    focus on learning, incentivised by various accessories offered to
                    customise your pet. Completing an assignment will be also a way
                    to take care of your pet, so that if you do not complete your assignments,
                    your pet will starve. This will also serve as a way for the teacher to grade their students.</p>
                <h3>Our team</h3>
                <ul>
                    <li>Karol Dayanne Rodriguez: Lead Back-End Developer</li><br />
                    <li>Nicolás Moreno: Project manager + QA tester</li><br />
                    <li>Mariana González: UI/UX Designer + Front-End Developer</li><br />
                    <li>Isaac Bonilla: Full-Stack Developer</li>
                </ul>
            </section>

            <section id="problematic">
                <h2>Problem Statement</h2>
                <p>Since a long time ago, technologies and methodologies have become increasingly sophisticated in various sectors of human development.
                    One such aspect has been education, however, according to the Organisation for Economic Co-operation and Development (2024),
                    young students have lost interest and motivation in their studies and in conventional teachning methods. Moreover, it was demonstrated by UNESCO (2023)
                    that students could be benefitted and learn more from dynamic methodologies that technology facilitates by making personalised and eye-catching study sessions.
                    It is due to all of the points mentioned above that the project strives to offer a learning alternative to students. Specifically by offering a teaching tool
                    for teachers to grade and allow their students to be entertained by gamified study activities. In order to develop this idea, a dynamic web page will be created
                    that is accessible to students at every hour, as well as the web for the professors, set and built over a gaming archetype of play, care and simulation.</p>
            </section>

            <section id="objectives">
                <h2>Project Objective</h2>
                <p>As a team we aspire to make a  website capable of improve at a certain way the grades of middle school students by teaching them studying an be funny and catching,
                    enhancing their autonomous study lessons. At the same time we aim to aid the teachers to bring a method different from the classic ones to make their students to
                    improve their academic perfomance.</p>
            </section>

            <section id="faq">
                <h2>Frequently Asked Questions</h2>

                {FAQ_ITEMS.map((item) => (
                    <article key={item.id}>
                        <h3>
                            <a href={"#" + item.id}>{item.question}</a>
                        </h3>

                        <p id={item.id}>
                            {item.answer}<br /> <br />
                            <a href="#faq">Close</a>
                        </p>
                    </article>
                ))}
            </section>
        </>
    );
}
