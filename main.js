const generateBtn = document.getElementById('generate');
const numbersDiv = document.getElementById('numbers');

generateBtn.addEventListener('click', () => {
    const numbers = [];
    while (numbers.length < 6) {
        const randomNumber = Math.floor(Math.random() * 45) + 1;
        if (!numbers.includes(randomNumber)) {
            numbers.push(randomNumber);
        }
    }
    numbersDiv.textContent = numbers.join(', ');
});
