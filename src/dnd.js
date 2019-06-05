/* Задание со звездочкой */

/*
 Создайте страницу с кнопкой.
 При нажатии на кнопку должен создаваться div со случайными размерами, цветом и позицией на экране
 Необходимо предоставить возможность перетаскивать созданные div при помощи drag and drop
 Запрещено использовать сторонние библиотеки. Разрешено пользоваться только тем, что встроено в браузер
 */

/*
 homeworkContainer - это контейнер для всех ваших домашних заданий
 Если вы создаете новые html-элементы и добавляете их на страницу, то дабавляйте их только в этот контейнер

 Пример:
   const newDiv = document.createElement('div');
   homeworkContainer.appendChild(newDiv);
 */
const homeworkContainer = document.querySelector('#homework-container');

/*
 Функция должна создавать и возвращать новый div с классом draggable-div и случайными размерами/цветом/позицией
 Функция должна только создавать элемент и задвать ему случайные размер/позицию/цвет
 Функция НЕ должна добавлять элемент на страницу. На страницу элемент добавляется отдельно

 Пример:
   const newDiv = createDiv();
   homeworkContainer.appendChild(newDiv);
 */
function createDiv() {
    let div = document.createElement('div'),
        width = ((Math.random()*100) + 50).toFixed(),
        height = ((Math.random()*100) + 50).toFixed();

    div.className = 'draggable-div';
    div.style.backgroundColor = '#'+ Math.round(0xffffff * Math.random()).toString(16);
    div.style.height = ((Math.random()*100) + 50).toFixed() + 'px';
    div.style.width = ((Math.random()*100) + 50).toFixed() + 'px';
    div.style.left = (Math.random() * (document.body.clientWidth - width)).toFixed() + 'px';
    div.style.top = (Math.random() * (document.body.clientHeight - height)).toFixed() + 'px';

    return div;
}

/*
 Функция должна добавлять обработчики событий для перетаскивания элемента при помощи drag and drop

 Пример:
   const newDiv = createDiv();
   homeworkContainer.appendChild(newDiv);
   addListeners(newDiv);
 */
function addListeners(target) {

    target.onmousedown = function(e) {
        let coords = getCoords(target),
            shiftX = e.pageX - coords.left,
            shiftY = e.pageY - coords.top;

        target.style.position = 'absolute';
        document.body.appendChild(target);
        moveAt(e);

        target.style.zIndex = 1000; // над другими элементами

        function moveAt(e) {
            target.style.left = e.pageX - shiftX + 'px';
            target.style.top = e.pageY - shiftY + 'px';
        }

        document.onmousemove = function(e) {
            moveAt(e);
        };

        target.onmouseup = function() {
            document.onmousemove = null;
            target.onmouseup = null;
        };

    }

    target.ondragstart = function() {
        return false;
    };

    function getCoords(elem) {
        let box = elem.getBoundingClientRect();

        return {
            top: box.top + pageYOffset,
            left: box.left + pageXOffset
        };
    }

}

let addDivButton = homeworkContainer.querySelector('#addDiv');

addDivButton.addEventListener('click', function() {
    // создать новый div
    const div = createDiv();

    // добавить на страницу
    homeworkContainer.appendChild(div);
    // назначить обработчики событий мыши для реализации D&D
    addListeners(div);
    // можно не назначать обработчики событий каждому div в отдельности, а использовать делегирование
    // или использовать HTML5 D&D - https://www.html5rocks.com/ru/tutorials/dnd/basics/
});

export {
    createDiv
};
