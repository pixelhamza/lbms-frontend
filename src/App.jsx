import { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

const API_URL = process.env.REACT_APP_API_URL;

function App() {
  // Authentication State
  const [isLoginMode, setIsLoginMode] = useState(true);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [token, setToken] = useState(null);

  // Book Management State
  const [books, setBooks] = useState([]);
  const [borrowedBooks, setBorrowedBooks] = useState([]);
  const [mostBorrowedBooks, setMostBorrowedBooks] = useState([]); // New state for most borrowed books
  const [newBook, setNewBook] = useState({
    title: '',
    author: '',
    category: '',
    isbn: '',
    published_date: '',
    available_copies: ''
  });
  const [editingBookId, setEditingBookId] = useState(null);
  const [loading, setLoading] = useState(false);

  // Pagination and Search State
  const [searchQuery, setSearchQuery] = useState('');
  const [nextPageUrl, setNextPageUrl] = useState(null);
  const [prevPageUrl, setPrevPageUrl] = useState(null);

  useEffect(() => {
    const storedToken = localStorage.getItem('token');
    if (storedToken) {
      setToken(storedToken);
      setIsLoggedIn(true);
      fetchBooks(`${API_URL}/books/`, storedToken);
      fetchBorrowedBooks(storedToken);
      fetchMostBorrowedBooks(storedToken); // Fetch most borrowed books on load
    }
  }, []);

  const fetchBooks = async (url, authToken) => {
  setLoading(true);
  try {
    const response = await axios.get(url, {
      headers: {
        Authorization: `Token ${authToken}`,
      },
      params: url.includes('search') ? {} : { search: searchQuery },
    });
    setBooks(response.data.results || response.data);
    setNextPageUrl(response.data.next);
    setPrevPageUrl(response.data.previous);
  } catch (error) {
    console.error('Failed to fetch books:', error);
    if (error.response && error.response.status === 401) {
      handleLogout();
    }
  } finally {
    setLoading(false);
  }
};

  const fetchBorrowedBooks = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/borrowed-books/`, {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      });
      setBorrowedBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch borrowed books:', error);
    }
  };
  
  const fetchMostBorrowedBooks = async (authToken) => {
    try {
      const response = await axios.get(`${API_URL}/most-borrowed/`, {
        headers: {
          Authorization: `Token ${authToken}`,
        },
      });
      setMostBorrowedBooks(response.data);
    } catch (error) {
      console.error('Failed to fetch most borrowed books:', error);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await axios.post(`${API_URL}/login/`, { username, password });
      const receivedToken = response.data.token;
      setToken(receivedToken);
      setIsLoggedIn(true);
      localStorage.setItem('token', receivedToken);
      fetchBooks(`${API_URL}/books/`, receivedToken);
      fetchBorrowedBooks(receivedToken);
      fetchMostBorrowedBooks(receivedToken);
    } catch (error) {
      console.error('Login failed:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await axios.post(`${API_URL}/register/`, { username, password });
      alert('Registration successful! Please log in.');
      setIsLoginMode(true);
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    setToken(null);
    localStorage.removeItem('token');
    setBooks([]);
    setBorrowedBooks([]);
    setMostBorrowedBooks([]);
  };

  const handleCreateOrUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editingBookId) {
        
        await axios.put(`${API_URL}/books/${editingBookId}/`, newBook, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        setEditingBookId(null);
        alert('Book updated successfully!');
      } else {
        
        await axios.post(`${API_URL}/books/`, newBook, {
          headers: {
            Authorization: `Token ${token}`,
          },
        });
        alert('Book created successfully!');
      }
      setNewBook({ title: '', author: '', category: '', isbn: '', published_date: '', available_copies: '' });
      fetchBooks(`${API_URL}/books/`, token);
    } catch (error) {
      console.error('Failed to save book:', error);
      alert('Failed to save book. Check your data and permissions.');
    } finally {
      setLoading(false);
    }
  };

const handleDelete = async (bookId) => {
    if (!window.confirm('Are you sure you want to delete this book?')) {
      return;
    }
    setLoading(true);
    try {
      
      await axios.delete(`${API_URL}/books/${bookId}/`, {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
      alert('Book deleted successfully!');
      fetchBooks(`${API_URL}/books/`, token);
    } catch (error) {
      console.error('Failed to delete book:', error);
      alert('Failed to delete book. Check your permissions.');
    } finally {
      setLoading(false);
    }
  };


  const handleBorrow = async (bookId) => {
      setLoading(true);
      try {
          await axios.post(`${API_URL}/books/${bookId}/borrow/`, {}, {
              headers: {
                  Authorization: `Token ${token}`,
              },
          });
          alert('Book borrowed successfully!');
          fetchBooks(`${API_URL}/books/`, token);
          fetchBorrowedBooks(token);
          fetchMostBorrowedBooks(token);
      } catch (error) {
          console.error('Failed to borrow book:', error);
          alert('Failed to borrow book. Check for available copies.');
      } finally {
          setLoading(false);
      }
  };

  const startEditing = (book) => {
    setEditingBookId(book.id);
    setNewBook(book);
  };

  return (
    <div className="app-container">
      {!isLoggedIn ? (
        <div className="auth-form-container">
          <h2>{isLoginMode ? 'Log In' : 'Register'}</h2>
          <form onSubmit={isLoginMode ? handleLogin : handleRegister}>
            <input type="text" placeholder="Username" value={username} onChange={(e) => setUsername(e.target.value)} required />
            <input type="password" placeholder="Password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            <button type="submit">{loading ? 'Loading...' : (isLoginMode ? 'Log In' : 'Register')}</button>
          </form>
          <p className="auth-toggle" onClick={() => setIsLoginMode(!isLoginMode)}>
            {isLoginMode ? "Don't have an account? Register" : "Already have an account? Log In"}
          </p>
        </div>
      ) : (
        <div className="main-container">
          <header>
            <h1>Library Management System</h1>
            <div className="header-controls">
              <input type="text" placeholder="Search books..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && fetchBooks(`${API_URL}/books/`, token)} />
              <button onClick={() => fetchBooks(`${API_URL}/books/`, token)}>Search</button>
              <button onClick={handleLogout}>Log Out</button>
            </div>
          </header>

          <div className="crud-container">
            <div className="book-form">
              <h2>{editingBookId ? 'Edit Book' : 'Add New Book'}</h2>
              <form onSubmit={handleCreateOrUpdate}>
               <input type="text" placeholder="Title" value={newBook.title} onChange={(e) => setNewBook({ ...newBook, title: e.target.value })} required />
    <input type="text" placeholder="Author" value={newBook.author} onChange={(e) => setNewBook({ ...newBook, author: e.target.value })} required />
    <input type="text" placeholder="Category" value={newBook.category} onChange={(e) => setNewBook({ ...newBook, category: e.target.value })} required />
    <input type="text" placeholder="ISBN" value={newBook.isbn} onChange={(e) => setNewBook({ ...newBook, isbn: e.target.value })} minLength="10" maxLength="13" required />
    <input type="date" placeholder="Published Date" value={newBook.published_date} onChange={(e) => setNewBook({ ...newBook, published_date: e.target.value })} required />
    <input type="number" placeholder="Available Copies" value={newBook.available_copies} onChange={(e) => setNewBook({ ...newBook, available_copies: e.target.value })} min="1" required />
    <button type="submit">{loading ? 'Loading...' : (editingBookId ? 'Update Book' : 'Add Book')}</button>
</form>
            </div>
          </div>

          <div className="book-list">
            <h2>Public Book Catalog</h2>
            {loading ? <p>Loading books...</p> : (
              <>
                <ul>
                  {books.map((book) => (
                    <li key={book.id}>
                      <div>
                        <strong>{book.title}</strong> by {book.author} ({book.category})
                        <p>ISBN: {book.isbn} | Copies: {book.available_copies}</p>
                      </div>
                      <div className="actions">
                        <button onClick={() => handleBorrow(book.id)}>Borrow</button>
                        <button onClick={() => startEditing(book)}>Edit</button>
                        <button onClick={() => handleDelete(book.id)}>Delete</button>
                      </div>
                    </li>
                  ))}
                </ul>
                <div className="pagination-controls">
                  <button onClick={() => fetchBooks(prevPageUrl, token, searchQuery)} disabled={!prevPageUrl}>Previous</button>
                  <button onClick={() => fetchBooks(nextPageUrl, token, searchQuery)} disabled={!nextPageUrl}>Next</button>
               </div>
              </>
            )}
          </div>
          
          <div className="borrowed-books">
            <h2>My Borrowed Books</h2>
            {borrowedBooks.length === 0 ? (
                <p>You have not borrowed any books yet.</p>
            ) : (
                <ul>
                    {borrowedBooks.map((borrowed) => (
                        <li key={borrowed.id}>
                            <strong>{borrowed.book.title}</strong>
                        </li>
                    ))}
                </ul>
            )}
          </div>
          
          <div className="most-borrowed-books">
            <h2>Most Borrowed Books</h2>
            {mostBorrowedBooks.length === 0 ? (
                <p>No books have been borrowed yet.</p>
            ) : (
                <ul>
                    {mostBorrowedBooks.map((book) => (
                        <li key={book.id}>
                            <strong>{book.title}</strong> by {book.author}
                            <p>Total Borrows: {book.total_borrows || 0}</p>
                        </li>
                    ))}
                </ul>
            )}
        </div>
        </div>
      )}
    </div>
  );
}

export default App;