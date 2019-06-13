/*
 Страница должна предварительно загрузить список городов из
 https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json
 и отсортировать в алфавитном порядке.

 При вводе в текстовое поле, под ним должен появляться список тех городов,
 в названии которых, хотя бы частично, есть введенное значение.
 Регистр символов учитываться не должен, то есть "Moscow" и "moscow" - одинаковые названия.

 Во время загрузки городов, на странице должна быть надпись "Загрузка..."
 После окончания загрузки городов, надпись исчезает и появляется текстовое поле.

 Разметку смотрите в файле towns-content.hbs

 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер

 *** Часть со звездочкой ***
 Если загрузка городов не удалась (например, отключился интернет или сервер вернул ошибку),
 то необходимо показать надпись "Не удалось загрузить города" и кнопку "Повторить".
 При клике на кнопку, процесс загрузки повторяется заново
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то добавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#homework-container');

/*
 Функция должна вернуть Promise, который должен быть разрешен с массивом городов в качестве значения

 Массив городов пожно получить отправив асинхронный запрос по адресу
 https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json
 */
function loadTowns() {

    return new Promise((resolve, reject) => {
        let xhr = new XMLHttpRequest();

        xhr.open('GET', 'https://raw.githubusercontent.com/smelukov/citiesTest/master/cities.json');
        xhr.responseType = 'json';

        xhr.addEventListener('load', () => {
            resolve (xhr.response.sort((a, b) => {
                return a.name > b.name? 1: -1
            }))
        });

        xhr.addEventListener('error', () => {
            reject();
        });

        xhr.send();
    });
}

/*
 Функция должна проверять встречается ли подстрока chunk в строке full
 Проверка должна происходить без учета регистра символов

 Пример:
   isMatching('Moscow', 'moscow') // true
   isMatching('Moscow', 'mosc') // true
   isMatching('Moscow', 'cow') // true
   isMatching('Moscow', 'SCO') // true
   isMatching('Moscow', 'Moscov') // false
 */
function isMatching(full, chunk) {

    return full.toLowerCase().indexOf(chunk.toLowerCase()) !== -1;
}

/* Блок с надписью "Загрузка" */
const loadingBlock = homeworkContainer.querySelector('#loading-block');
/* Блок с текстовым полем и результатом поиска */
const filterBlock = homeworkContainer.querySelector('#filter-block');
/* Текстовое поле для поиска по городам */
const filterInput = homeworkContainer.querySelector('#filter-input');
/* Блок с результатами поиска */
const filterResult = homeworkContainer.querySelector('#filter-result');

let towns = [];
let tryAgain = document.createElement('button');

tryAgain.textContent = 'Повторить';
homeworkContainer.appendChild(tryAgain);
tryAgain.addEventListener('click', () => {
    loadTowns();
    homeworkContainer.removeChild(tryAgain);
});

loadTowns()
    .then(res => {
        towns = res;
        tryAgain.style.display = 'none';
        loadingBlock.style.display = 'none';
        filterBlock.style.display = 'block';
    })
    .catch(() => {
        tryAgain.style.display = 'block';
        filterResult.innerHTML = 'Не удалось загрузить города';
    });

filterInput.addEventListener('keyup', function() {

    // это обработчик нажатия кливиш в текстовом поле

    if (filterInput.value) {

        let filterTown = towns.filter(item => isMatching(item.name, filterInput.value)),
            result = filterTown.map(item => item.name.toString());

        for (let i = 0; i < result.length; i++) {
            let div = document.createElement('p');

            div.innerText = result[i];
            filterResult.appendChild(div);
        }
    } else {
        filterResult.innerHTML = '';
    }

});

export {
    loadTowns,
    isMatching
};
