/* PartyHUB — Who's Most Likely / Kto Najprawdopodobniej
   Baza pytań podzielona na kategorie.
   [PH] QUESTIONS_BEGIN
*/

const WHOSLIKELY_QUESTIONS = {
    categories: [
        {
            id: 'party',
            name: 'Impreza 🎉',
            questions: [
                'Kto najprawdopodobniej zatańczy na stole?',
                'Kto najprawdopodobniej zostanie do końca imprezy?',
                'Kto najprawdopodobniej zaśnie pierwszy?',
                'Kto najprawdopodobniej zrobi karaoke?',
                'Kto najprawdopodobniej zgubi telefon na imprezie?',
                'Kto najprawdopodobniej zacznie śpiewać głośniej niż muzyka?',
                'Kto najprawdopodobniej zorganizuje najlepszą imprezę?',
                'Kto najprawdopodobniej będzie robił zdjęcia całą noc?',
                'Kto najprawdopodobniej pójdzie na after party?',
                'Kto najprawdopodobniej zamówi taksówkę jako pierwszy?'
            ]
        },
        {
            id: 'friends',
            name: 'Przyjaźń 👫',
            questions: [
                'Kto najprawdopodobniej zapomni o urodzinach przyjaciela?',
                'Kto najprawdopodobniej pomoże w przeprowadzce?',
                'Kto najprawdopodobniej będzie najlepszym świadkiem na ślubie?',
                'Kto najprawdopodobniej zadzwoni o 3 w nocy, żeby pogadać?',
                'Kto najprawdopodobniej pożyczy pieniądze i zapomni oddać?',
                'Kto najprawdopodobniej zawsze spóźnia się na spotkania?',
                'Kto najprawdopodobniej zorganizuje niespodziankę urodzinową?',
                'Kto najprawdopodobniej pamięta wszystkie rocznice?',
                'Kto najprawdopodobniej jest najlepszym słuchaczem?',
                'Kto najprawdopodobniej powie "mówię ci jako przyjaciel..."?'
            ]
        },
        {
            id: 'travel',
            name: 'Podróże ✈️',
            questions: [
                'Kto najprawdopodobniej zgubi bagaż na lotnisku?',
                'Kto najprawdopodobniej pojedzie w podróż solo?',
                'Kto najprawdopodobniej zaprzyjaźni się z miejscowymi?',
                'Kto najprawdopodobniej będzie narzekać na pogodę?',
                'Kto najprawdopodobniej spóźni się na samolot?',
                'Kto najprawdopodobniej spakuje się w ostatniej chwili?',
                'Kto najprawdopodobniej zostanie bez internetu najdłużej?',
                'Kto najprawdopodobniej zrobi 1000 zdjęć dziennie?',
                'Kto najprawdopodobniej próbuje lokalnego jedzenia pierwszy?',
                'Kto najprawdopodobniej zgubi się w nowym mieście?'
            ]
        },
        {
            id: 'food',
            name: 'Jedzenie 🍕',
            questions: [
                'Kto najprawdopodobniej zje resztki z lodówki o 3 w nocy?',
                'Kto najprawdopodobniej zamówi pizzę na śniadanie?',
                'Kto najprawdopodobniej jest foodie?',
                'Kto najprawdopodobniej zostanie szefem kuchni?',
                'Kto najprawdopodobniej pójdzie na drugą kolację?',
                'Kto najprawdopodobniej zrobi zdjęcie jedzeniu przed zjedzeniem?',
                'Kto najprawdopodobniej zjada deser jako pierwszy?',
                'Kto najprawdopodobniej próbuje każdej diety?',
                'Kto najprawdopodobniej jest wybredny w jedzeniu?',
                'Kto najprawdopodobniej zamówi to samo co zawsze?'
            ]
        },
        {
            id: 'crazy',
            name: 'Szaleństwa 🤪',
            questions: [
                'Kto najprawdopodobniej skoczy na bungee?',
                'Kto najprawdopodobniej zrobi tatuaż spontanicznie?',
                'Kto najprawdopodobniej przeprowadzi się do innego kraju?',
                'Kto najprawdopodobniej przyjdzie w przebraniu gdzie nie trzeba?',
                'Kto najprawdopodobniej zaśpiewa w metrze?',
                'Kto najprawdopodobniej zrobi dziwny zakład?',
                'Kto najprawdopodobniej będzie miał najdziwniejszy pomysł?',
                'Kto najprawdopodobniej zaryzykuje wszystko dla przygody?',
                'Kto najprawdopodobniej pójdzie na randkę w ciemno?',
                'Kto najprawdopodobniej wystąpi w reality show?'
            ]
        },
        {
            id: 'life',
            name: 'Życie 🌟',
            questions: [
                'Kto najprawdopodobniej weźmie ślub jako pierwszy?',
                'Kto najprawdopodobniej będzie miał najwięcej dzieci?',
                'Kto najprawdopodobniej zostanie milionerem?',
                'Kto najprawdopodobniej napisze książkę?',
                'Kto najprawdopodobniej będzie sławny?',
                'Kto najprawdopodobniej zmieni karierę po 40-tce?',
                'Kto najprawdopodobniej będzie żyć najdłużej?',
                'Kto najprawdopodobniej zostanie politykiem?',
                'Kto najprawdopodobniej będzie miał najciekawsze życie?',
                'Kto najprawdopodobniej pomoże zmienić świat?'
            ]
        },
        {
            id: 'habits',
            name: 'Nawyki 😅',
            questions: [
                'Kto najprawdopodobniej sprawdza telefon co 5 minut?',
                'Kto najprawdopodobniej jest nocnym markiem?',
                'Kto najprawdopodobniej jest rannym ptaszkiem?',
                'Kto najprawdopodobniej prokrastynuje najbardziej?',
                'Kto najprawdopodobniej jest najbardziej zorganizowany?',
                'Kto najprawdopodobniej zapomina gdzie położył klucze?',
                'Kto najprawdopodobniej ma najbardziej chaotyczny pokój?',
                'Kto najprawdopodobniej robi listy do wszystkiego?',
                'Kto najprawdopodobniej ogląda seriale całą noc?',
                'Kto najprawdopodobniej ignoruje wiadomości przez dni?'
            ]
        },
        {
            id: 'spicy',
            name: '18+ 🌶️',
            adult: true,
            questions: [
                'Kto najprawdopodobniej flirtuje nieświadomie?',
                'Kto najprawdopodobniej miał najbardziej niezręczną randkę?',
                'Kto najprawdopodobniej napisze do ex po imprezie?',
                'Kto najprawdopodobniej ma sekretnego crasha w tej grupie?',
                'Kto najprawdopodobniej pójdzie na randkę z Tindera?',
                'Kto najprawdopodobniej wygłupia się najbardziej przy crushi?',
                'Kto najprawdopodobniej ma najdłuższą historię związków?',
                'Kto najprawdopodobniej zostanie złapany na kłamstwie o związku?',
                'Kto najprawdopodobniej ma najgorszy gust w partnerach?',
                'Kto najprawdopodobniej zostanie najbardziej romantycznym partnerem?'
            ]
        }
    ]
};

// Helper: get all questions flat (for random picking)
WHOSLIKELY_QUESTIONS.getAllQuestions = function (includeAdult = false) {
    const all = [];
    this.categories.forEach(cat => {
        if (cat.adult && !includeAdult) return;
        cat.questions.forEach(q => all.push({ category: cat.id, categoryName: cat.name, text: q }));
    });
    return all;
};

// Helper: get questions from specific categories
WHOSLIKELY_QUESTIONS.getByCategories = function (categoryIds = [], includeAdult = false) {
    const all = [];
    const ids = new Set(categoryIds);
    this.categories.forEach(cat => {
        if (cat.adult && !includeAdult) return;
        if (ids.size && !ids.has(cat.id)) return;
        cat.questions.forEach(q => all.push({ category: cat.id, categoryName: cat.name, text: q }));
    });
    return all;
};

/* [PH] QUESTIONS_END */
