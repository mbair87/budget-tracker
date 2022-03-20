
let db;
const request = indexedDB.open('budget_tracker', 1);

request.onupgradeneeded = function (event) {
    const db = event.target.result;
    db.createObjectStore('budget_tracker', { autoIncrement: true });
};


request.onsuccess = function (event) {
     // when db is successfully created with its object store (from onupgradedneeded event above), save reference to db in global variable
    db = event.target.result;

    // check if app is online, if yes run checkDatabase() function to send all local db data to api
    if (navigator.onLine) {
        uploadBudget();
    }
};

request.onerror = function (event) {
    // log error here
    console.log(event.target.errorCode);
};

// This function will be executed if we attempt to submit a new budget without internet connection
function saveRecord(record) {

    const transaction = db.transaction(['budget_tracker'], 'readwrite');

    const budgetObjectStore = transaction.objectStore('budget_tracker');

    // add record to your store with add method
    budgetObjectStore.add(record);
}

function uploadBudget() {
    // open a transaction on your pending db
    const transaction = db.transaction(['budget_tracker'], 'readwrite');

    // access your pending object store
    const budgetObjectStore = transaction.objectStore('budget_tracker');

    // get all records from store and set to a variable
    const getAll = budgetObjectStore.getAll();

  
    getAll.onsuccess = function () {
        // if there was data in indexedDb's store, let's send it to the api server
        if (getAll.result.length > 0) {
            fetch('/api/transaction/bulk', {
                method: 'POST',
                body: JSON.stringify(getAll.result),
                headers: {
                    Accept: 'application/json, text/plain, */*',
                    'Content-Type': 'application/json'
                }
            })
                .then(response => response.json())
                .then(serverResponse => {
                    if (serverResponse.message) {
                        throw new Error(serverResponse);
                    }
                    const transaction = db.transaction(['budget_tracker'], 'readwrite');
                    const budgetObjectStore = transaction.objectStore('budget_tracker');
                    budgetObjectStore.clear();

                    alert('All saved transactions have been submitted!');
                })
                .catch(err => {
                    // set reference to redirect back here
                    console.log(err);
                });
        }
    };
}

// listen for app coming back online
window.addEventListener('online', uploadBudget);