'use strict';

window.$ = window.jQuery = require('jquery'); // add jQuery

// debug tool - support for setting up calculator
const debug = false; // set to true to show console log with pressed keys and actions

// Define all major calculator parts
const calculator = $('#calculator');
const display = $('#calculator .display');
const keys = $('button');
const clearButton = $('button[data-action=clear]');
const history = $('#history');

/*
Passes all calculations to the nodejs api via ajax post and creates a promise
Returns the result of the calculation as well as the calculation string for the history
*/
const calculate = (n1, operator, n2) => {

    const request = {
        n1: n1,
        n2: n2,
        operator: operator
    };

    //If post request to port 3001 was successful, return n1, n2 and operator and add <li> to history
    const result = $.ajax({
        type: 'POST',
        url: 'http://localhost:3001',
        dataType: 'json',
        data: request,
        success: function (data) {
            history.prepend(`<li>${data.calc} = ${data.result}</li>`);
        }
    });
    return result;
};

//Put the result into the display
const createResultString = (value) => {
    if (value === null) {
        display.text('NaN');
        return;
    }
    display.text(value);
};

//Add click event listener for all buttons
keys.on('click', e => {
    const key = $(e.target); // make target a jQuery instance
    const action = key.attr('data-action'); // if data-action exists, get the data-action attribute from the button
    const keyContent = key.text(); // get value of the pressed key
    const displayedNum = display.text(); // get value of the display
    const previousKeyType = calculator.data('previousKeyType'); // memorize the previous key type

    keys.removeClass('is-pressed'); // Remove .is-pressed class from all keys
    key.blur(); // remove focus from clicked keys for returning key functionality

    //action when NUMBER keys get clicked
    if (!action) {
        if (
            displayedNum === '0' ||
            previousKeyType === 'operator' ||
            previousKeyType === 'calculate'
        ) {
            createResultString(keyContent);
        } else {
            createResultString(displayedNum + keyContent);
        }
        calculator.data('previousKeyType', 'number');
    }

    //action when OPERATOR keys get clicked & get first Value, operator and displayed number for calculation
    if (
        action === 'add' ||
        action === 'subtract' ||
        action === 'multiply' ||
        action === 'divide' ||
        action === 'powy' ||
        action === 'nthrt'
    ) {
        const firstValue = calculator.data('firstValue');
        const operator = calculator.data('operator');
        const secondValue = displayedNum;

        // Check whether firstValue and operator are available. Note: secondValue always exists.
        if (
            firstValue &&
            operator &&
            previousKeyType !== 'operator' &&
            previousKeyType !== 'calculate'
        ) {
            calculate(firstValue, operator, secondValue)
                .then(function (data) {
                    const calcValue = data.result;
                    createResultString(calcValue);
                    calculator.data('firstValue', calcValue);
                });
        } else {
            calculator.data('firstValue', displayedNum); //if no first value exists, create it with displayed number
        }
        key.addClass('is-pressed'); // used to style operators
        calculator.data('previousKeyType', 'operator');
        calculator.data('operator', action);
    }

    //plus minus button: switches positive values to minus, negative values to positve numbers
    if (
        action === 'plusminus'
    ) {

        let calcValue = displayedNum;
        switch (Math.sign(displayedNum)) {
        case 1:
            calcValue = -Math.abs(displayedNum);
            break;
        case -1:
            calcValue = Math.abs(displayedNum);
            break;
        }

        calculator.data('firstValue', calcValue);
        createResultString(calcValue);
        calculator.data('previousKeyType', 'operator');
        calculator.data('operator', action);
    }

    //advanced key section
    if (
        action === 'pow' ||
        action === 'pow3' ||
        action === 'sqrt' ||
        action === 'cbrt' ||
        action === 'sin' ||
        action === 'cos' ||
        action === 'percent'
    ) {
        //immediate calculation of displayed number and data-action of pressed advanced key
        calculate(displayedNum, action)
            .then((data) => {
                const calcValue = data.result;
                createResultString(calcValue);
                calculator.data('firstValue', calcValue);
            });

        calculator.data('previousKeyType', 'operator');
        calculator.data('operator', action);
    }

    //decimal-key: appends . to displayed number or of no number is displayed, appends 0.
    if (action === 'decimal') {
        if (!displayedNum.includes('.')) {
            createResultString(displayedNum + '.');
        } else if (
            previousKeyType === 'operator' ||
            previousKeyType === 'calculate'
        ) {
            createResultString('0.');
        }
        calculator.data('previousKeyType', 'decimal');
    }

    //clear Button
    if (action === 'clear') {
        // if (key.text() === 'AC') {
            calculator.data('firstValue', '');
            calculator.data('modValue', '');
            calculator.data('operator', '');
            calculator.data('previousKeyType', '');
        // } else {
        //     key.text('AC');
        // }
        createResultString(0);
        calculator.data('previousKeyType', 'clear');
    }

    //equals-Button: checks first for valid inputs before starting calculation process
    if (action === 'calculate') {
        let firstValue = calculator.data('firstValue');
        const operator = calculator.data('operator');
        let secondValue = displayedNum;
        if (firstValue) {
            if (previousKeyType === 'calculate') {
                firstValue = displayedNum;
                secondValue = calculator.data('modValue');
            }
            calculate(firstValue, operator, secondValue)
                .then(function (data) {
                    createResultString(data.result);// v1 is undefined
                });
        }
        // Set modValue attribute
        calculator.data('modValue', secondValue);
        calculator.data('previousKeyType', 'calculate');
    }

    /* if (action !== 'clear') {
        clearButton.text('CE');
    } */

    //debug tool - only used for setting up calculator
    if (debug) {
        console.log(`
            action = ${action}
            keyContent = ${keyContent}
            displayedNum = ${displayedNum}
            previousKeyType = ${previousKeyType}
        `);
    }
});

//Listen for Keyboard events
$(document).on('keyup', e => {
    e.preventDefault();
    if (debug) {
        console.log(`keyCode = ${e.keyCode}`);
    }
    const pressedKey = $(`button[data-key='${getPressedKey(e.keyCode, e.shiftKey)}']`);
    if (!pressedKey) return;
    pressedKey.click();
});

//transform pressed keyboard-keys into numberic values for calcultion
const getPressedKey = function (keyCode, shiftKey) {
    const isShift = shiftKey ? true : false;

    if (isShift && keyCode == 53) { return 53; } // % key
    if (keyCode == 48 || keyCode == 96) { return 96; } // 0
    if (keyCode == 49 || keyCode == 97) { return 97; } // 1
    if (keyCode == 50 || keyCode == 98) { return 98; } // 2
    if (keyCode == 51 || keyCode == 99) { return 99; } // 3
    if (keyCode == 52 || keyCode == 100) { return 100; } // 4
    if (keyCode == 53 || keyCode == 101) { return 101; } // 5
    if (keyCode == 54 || keyCode == 102) { return 102; } // 6
    if ((isShift && keyCode == 55) || keyCode == 191 || keyCode == 111) { return 111; } // / devide
    if (keyCode == 55 || keyCode == 103) { return 103; } // 7
    if ((!isShift && keyCode == 56) || keyCode == 104) { return 104; } // 8
    if (keyCode == 57 || keyCode == 105) { return 105; } // 9
    if ((isShift && keyCode == 56 || keyCode == 221) || keyCode == 106) { return 106; } // * multiply
    if (keyCode == 187 || keyCode == 107 || keyCode == 171) { return 107; } // + add
    if (keyCode == 189 || keyCode == 109) { return 109; } // - subtract
    if (keyCode == 190 || keyCode == 110) { return 190; } // .
    if (keyCode == 46 || keyCode == 8 || keyCode == 12) { return 8; } // delete key clear
    if ((isShift && keyCode == 48) || keyCode == 13) { return 13; } // return key  =

    return false;
};

//save layout settings to local storage
function saveToLocalStorage(type, value) {
    localStorage.setItem(type, value);
}

/* detect user settings or set default layout
apply style and size
implement loader function */
$(function () {
    let style = localStorage.getItem('style') || 'dark';
    let size = localStorage.getItem('size') || 'regular';
    let adv = localStorage.getItem('adv') || false;
    let his = localStorage.getItem('his') || false;

    $('body').addClass(style + ' ' + size);
    $('.styleSwitch[data-style=' + style + ']').addClass('active');
    $('.sizeSwitch[data-style=' + size + ']').addClass('active');

    $('#loader').delay(500).fadeOut(500, function () {
        if (adv === 'true') $('.toggle:eq(1)').click();
        if (his === 'true') $('.toggle:eq(2)').click();
    });

    $('.styleSwitch').on('click', function (e) {
        e.preventDefault();
        $('.styleSwitch').removeClass('active');
        $(this).addClass('active');
        style = $(this).attr('data-style');
        size = $('.sizeSwitch.active').attr('data-style');
        $('body').attr('class', '').addClass(style + ' ' + size);
        saveToLocalStorage('style', style);
    });

    $('.sizeSwitch').on('click', function (e) {
        e.preventDefault();
        $('.sizeSwitch').removeClass('active');
        $(this).addClass('active');
        size = $(this).attr('data-style');
        style = $('.styleSwitch.active').attr('data-style');
        $('body').attr('class', '').addClass(size + ' ' + style);
        saveToLocalStorage('size', size);
    });

    $('a.toggle').on('click', function (e) {
        e.preventDefault();
        let item = $(this);
        item.blur();
        item.parent().next().slideToggle(function () {
            if(item.text() != '') {
                saveToLocalStorage(item.text(), $(this).is(':visible'));
            }
        });
        item.find('i').toggleClass('rotate');
    });

    //theme picker visibilty
    $(document).mousedown(function (e) {
        var clicked = $(e.target); // make clicked element jQuery element
        if (!clicked.is('#themePicker') && !clicked.parents().is('#themePicker') && !clicked.parents().is('#settings')) {
            if ($('#themePicker').is(':visible')) {
                $('#themePicker').slideUp();
                $('#settings').find('i').toggleClass('rotate');
            }
        }
    });

});
