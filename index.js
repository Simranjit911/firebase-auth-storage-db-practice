import { initializeApp } from "firebase/app"
import { addDoc, collection, deleteDoc, doc, getDocs, getFirestore, onSnapshot, query, where, orderBy, serverTimestamp, getDoc, updateDoc, limit } from "firebase/firestore"
import { createUserWithEmailAndPassword, getAuth, onAuthStateChanged, signInWithEmailAndPassword, signOut } from 'firebase/auth'
import { getDownloadURL, getStorage, ref, uploadBytes } from "firebase/storage";

const firebaseConfig = {
    
};
// initialize app
let app = initializeApp(firebaseConfig)

// get db
const db = getFirestore()
// get auth
let auth = getAuth()
// storage
let storage = getStorage(app)
// let storageRef = firebase.storage().ref()

// collection ref
const colRef = collection(db, 'books')

// insert into ui
let table = document.getElementById('table')
let tbody = table.getElementsByTagName('tbody')[0]
let books = [];

function insertInUI() {
    tbody.innerHTML = ""
    books?.map((data, i) => {
        let new_row = `
        <tr>
        <td>${i + 1}</td>
        <td>${data.id}</td>
        <td>${data.title}</td>
        <td>${data.author}</td>
        <td><img src=${data.fileURL} alt=${data.title}></td>
        </tr>
        `
        tbody.insertAdjacentHTML('beforeend', new_row)
    })
}
// Function to get collection data using async/await

// async function getCollectionData() {
//     try {
//         const snapshot = await getDocs(colRef);
//         snapshot.docs.map((doc) => {
//             books.push({ ...doc.data(), id: doc.id });
//         });
//         // return books;
//         insertInUI()
//     } catch (e) {
//         console.error('Error fetching documents: ', e);
//     }
// }


//Firebase query ,use this in async fn 
let q = await query(colRef, orderBy('author', "asc"), limit(5))

// Subscribing to a collection
let unsubAllCol = onSnapshot(colRef, (snapshot) => {
    console.log(books)
    books = []
    snapshot.docs.map((doc) => {
        books.push({ ...doc.data(), id: doc.id });
    });
    books.sort((a, b) => a.author.localeCompare(b.author))
    setTimeout(() => {
        insertInUI()

    }, 200);
})

// get single doc
let bID = 'VsmElarLiMycGiddb3lB'
let singleDocRef = doc(db, 'books', bID)
getDoc(singleDocRef)
    .then((doc) => {
        console.log('Single doc', doc.data())
    })
    .catch((e) => console.log(e))

// subscribe to single doc
onSnapshot(singleDocRef, (doc) => {
    console.log("SIngle doc=>", { ...doc.data(), id: doc.id })
})

// Delete and add operation
let addBookForm = document.getElementById('addBookForm')
addBookForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    let fileInput = addBookForm.file;
    let file = fileInput.files[0];
    let title = addBookForm.title.value;
    let author = addBookForm.author.value;
    if (!file) {
        return alert('File not available')
    }
    try {
        let storageRef = ref(storage, `files/${file.name}`)
        let snapshot = await uploadBytes(storageRef, file)

        let fileUrl = await getDownloadURL(snapshot.ref)
        console.log(fileUrl, snapshot)

        let res = await addDoc(colRef, {
            title: addBookForm.title.value,
            author: addBookForm.author.value,
            fileURL: fileUrl,
            createdAt: serverTimestamp()
        });
        console.log(res)

        // Insert the new book into the UI
        books.push({ id: res.id, title: addBookForm.title.value, author: addBookForm.author.value })
        // insertInUI();

        // Clear the form after submission
        addBookForm.reset();

    } catch (error) {
        console.error('Error adding document: ', error);
    }

})

// Delete Book
let deleteBookForm = document.getElementById('deleteBookForm');
deleteBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    try {
        const deleteDocRef = doc(db, 'books', deleteBookForm.bookID.value);
        await deleteDoc(deleteDocRef);
        books = books.filter(book => book.id !== deleteBookForm.bookID.value);
        // getCollectionData()
        // insertInUI();
        deleteBookForm.reset();
    } catch (error) {
        console.error('Error deleting document: ', error);
    }
});

// update Book
// Get the update form
let updateBookForm = document.getElementById('updateBookForm');

updateBookForm.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Access the form elements
    const bookID = updateBookForm.bookID.value;
    const title = updateBookForm.title.value;
    const author = updateBookForm.author.value;

    console.log(bookID, title, author);

    try {
        let updateDocRef = doc(db, 'books', bookID);
        await updateDoc(updateDocRef, {
            title: title,
            author: author,
            updatedAt: serverTimestamp()
        });
        updateBookForm.reset();
    } catch (error) {
        console.log(error);
    }
});

// Firebase Authentication
let sigUpForm = document.getElementById('signUpForm')
sigUpForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    let email = sigUpForm.email.value
    let password = sigUpForm.password.value
    try {
        let res = await createUserWithEmailAndPassword(auth, email, password)
        console.log('User =>', res.user)
        sigUpForm.reset()
    } catch (error) {
        alert(error)
        console.log(error)
    }
})

//Logut
let logOutBtn = document.getElementById('logout')
logOutBtn.addEventListener('click', async (e) => {
    e.preventDefault()
    try {
        let res = await signOut(auth)
        console.log(res)
        alert("User Logout")
    } catch (error) {
        console.log(error)
        alert(error)
    }


})
// Login form
let loginForm = document.getElementById('loginForm')
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault()
    try {
        let email = loginForm.email.value
        let password = loginForm.password.value
        let res = await signInWithEmailAndPassword(auth, email, password)
        console.log(res.user)
        if (res.user) {
            loginForm.reset()
            alert('user login successfully')
        }

    } catch (error) {
        alert(error)
        console.log(error)
    }
})

// Subscribing to auth
let authUnsub = onAuthStateChanged(auth, (user) => {
    console.log("Auth State changed", user)
})

// Unsubscibing
let unSubBtn = document.getElementById('unSub')
unSubBtn.addEventListener('click', () => {
    console.log("Unsubscribing", authUnsub, unsubAllCol)
})


// functions

