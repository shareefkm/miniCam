
const passwordInput = document.getElementById('password-input');
const confirmPasswordInput = document.getElementById('confirm-password-input');

// Add event listeners to the password and confirm password fields
passwordInput.addEventListener('input', validatePassword);
confirmPasswordInput.addEventListener('input', validatePassword);

function validatePassword() {
  const password = passwordInput.value;
  const confirmPassword = confirmPasswordInput.value;

  // Check if the password and confirm password fields match
  if (password !== confirmPassword) {
    confirmPasswordInput.setCustomValidity("Passwords don't match");
  } else {
    confirmPasswordInput.setCustomValidity('');
  }
}