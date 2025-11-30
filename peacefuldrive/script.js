document.addEventListener('DOMContentLoaded', () => {
    const selectButtons = document.querySelectorAll('.select-car-button');

    selectButtons.forEach(button => {
        button.addEventListener('click', () => {
            // Reset all buttons to 'Select'
            selectButtons.forEach(btn => {
                btn.textContent = 'Select';
                btn.classList.remove('selected');
            });

            // Set the clicked button to 'Selected'
            button.textContent = 'Selected';
            button.classList.add('selected');
        });
    });
});
