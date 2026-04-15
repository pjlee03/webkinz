// Login form elements
let signup = document.querySelector(".signup");
let login = document.querySelector(".login");
let slider = document.querySelector(".slider");
let formSection = document.querySelector(".form-section");
signup.addEventListener("click", () => {
    slider.classList.add("moveslider");
    formSection.classList.add("form-section-move");
});
login.addEventListener("click", () => {
    slider.classList.remove("moveslider");
    formSection.classList.remove("form-section-move");
});

// Initialize Supabase
const supabaseUrl = 'https://xcuqxonyaswkuzvjdgtu.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhjdXF4b255YXN3a3V6dmpkZ3R1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzYyMDgyMjYsImV4cCI6MjA5MTc4NDIyNn0.riLwQCTSuEtQ0-Y4rudWLhvqUh3Uzob-9oq2a6Py4Os';
const supabaseClient = supabase.createClient(supabaseUrl, supabaseAnonKey);

const loginSubmitBtn = document.getElementById("loginSubmitBtn");
const signupSubmitBtn = document.getElementById("signupSubmitBtn");

// Activate login or signup procedure
if (loginSubmitBtn) {
    loginSubmitBtn.addEventListener("click", () => {userLogin();});
} else {
    console.error("No login function found.");
}

if (signupSubmitBtn) {
    signupSubmitBtn.addEventListener("click", () => {createAccount();});
} else {
    console.error("No signup function found.");
}

async function createAccount() {
    // Collect inputs from signup fields
    const emailInput = document.getElementById("signupEmail").value;
    const passwordInput = document.getElementById("signupPassword").value;
    const confirmInput = document.getElementById("signupConfirm").value;

    if (passwordInput !== confirmInput) {
        alert("Passwords do not match!");
        return;
    }
    if (passwordInput.length < 6) {
        alert("Password must be at least 6 characters.");
        return;
    }

    // Call Supabase to create the user
    const { data, error } = await supabaseClient.auth.signUp({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        console.error("Supabase Signup Error:", error.message);
        alert("Error: " + error.message);
    } else {
        console.log("Signup successful!", data);
        alert("Account created successfully! You can now log in.");
    }
}

async function userLogin() {
    // Collect inputs from login fields
    const emailInput = document.getElementById("loginEmail").value;
    const passwordInput = document.getElementById("loginPassword").value;

    // Call Supabase to log the user in
    const { data, error } = await supabaseClient.auth.signInWithPassword({
        email: emailInput,
        password: passwordInput,
    });

    if (error) {
        console.error("Supabase Login Error:", error.message);
        alert("Login failed: " + error.message);
    } else {
        console.log("Login successful!", data);
        alert("Login successful!");
        window.location.href = "index.html";  // Redirect to home page
    }
}