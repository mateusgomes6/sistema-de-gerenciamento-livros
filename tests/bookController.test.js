const bookController = require('../src/controllers/bookController');
const Book = require('../src/models/Book');
const httpMocks = require('node-mocks-http');

beforeEach(() => {
    jest.clearAllMocks();
})

jest.mock('../src/models/Book');

describe('Book Controller - succesfully', () => {
    it('getAllBooks should return a list of books with status 200', async () => {
        const mockBooks = [{ id: 1, titulo: 'Livro A', autor: 'Autor Z', genero: 'Gênero D', ano_publicacão: 2013}];
        Book.getAll.mockResolvedValue(mockBooks);

        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        await bookController.getAllBooks(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ books: mockBooks });
        expect(Book.getAll).toHaveBeenCalledTimes(1);
    });

    it('getBookById should return a book with status 200 if found', async () => {
        const mockBook = { id: 1, titulo: 'Livro Y', autor: 'Autor S', genero: 'Gênero K', ano_publicacão: 2021};
        Book.getById.mockResolvedValue(mockBook);

        const req = httpMocks.createRequest({ params: { id: '1' } });
        const res = httpMocks.createResponse();

        await bookController.getBookById(req, res);
        
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ book: mockBook });
        expect(Book.getById).toHaveBeenCalledWith(1);
    });

    it('getBookByGenre should return a list of books of a specific genre with status 200', async () => {
        const mockBooks = [{ id: 2, titulo: 'Originals', autor: 'Adam Grant', genero: 'Investimento', ano_publicacão: 2017}];
        Book.getByGenre.mockResolvedValue(mockBooks);

        const req = httpMocks.createRequest({
            params: { genero: 'Investimento' }
        });
        const res = httpMocks.createResponse();

        await bookController.getByGenre(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData).toEqual({ books: mockBooks });
        expect(Book.getByGenre).toHaveBeenCalledWith('Investimento');
        expect(Book.getByGenre).toHaveBeenCalledTimes(1);
    });

    it('addBook should create a new book and return it with status 201', async () => {
        const newBookData = {
            titulo: 'Novo livro',
            autor: 'Novo autor',
            genero: 'Novo gênero',
            ano_publicacao: 2025,
        };
        const mockCreatedBook = { id: 2, ...newBookData }
        Book.create.mockResolvedValue(mockCreatedBook);

        const req = httpMocks.createRequest({
            method: 'POST',
            url: '/books',
            body: newBookData,
        });
        const res = httpMocks.createResponse();

        await bookController.create(req, res);

        expect(res.statusCode).toBe(201);
        expect(res._getJSONData).toEqual({ book: mockCreatedBook });
        expect(Book.create).toHaveBeenCalledTimes(1);
        expect(Book.create).toHaveBeenCalledWith(newBookData);
    });

    it('updateBook should update a book and return it with status 200', async () => {
        const bookId = 3;
        const updatedBookData = { titulo: 'Livro Q', ano_publicacão: 2004};
        const mockUpdatedBook = { id: bookId, ...updatedBookData, autor: 'Autor Y', genero: 'Gênero I'};
        Book.update.mockResolvedValue([1]);
        Book.getById.mockResolvedValue(mockUpdatedBook);

        const req = httpMocks.createRequest({
            params: { id: bookId },
            body: updatedBookData
        });
        const res = httpMocks.createResponse();

        await bookController.update(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual({ book: mockUpdatedBook });
        expect(Book.findById).toHaveBeenCalledWith(bookId);
        expect(Book.findById).toHaveBeenCalledTimes(1);
        expect(Book.update).toHaveBeenCalledWith(bookId, updatedBookData);
        expect(Book.update).toHaveBeenCalledTimes(1);
    });

    it('deleteBook should delete a book and return status 204', async () => {
        const bookId = 5;
        Book.destroy.mockResolvedValue(1);

        const req = httpMocks.createRequest({
            params: { id: bookId }
        });
        const res = httpMocks.createResponse();

        await bookController.delete(req, res);

        expect(res.statusCode).toBe(204);
        expect(res._isEndCalled()).toBe(true);
        expect(Book.destroy).toHaveBeenCalledWith({ where: { id: bookId } });
        expect(Book.destroy).toHaveBeenCalledTimes(1);
    });
});



describe('Book Controller - failure', () => {
    it('getAllBooks should return status 500 when database fails', async () => {
        const errorMessage = 'Database connection failed';
        Book.getAll.mockRejectedValue(new Error(errorMessage));
    
        const req = httpMocks.createRequest();
        const res = httpMocks.createResponse();

        await bookController.getAllBooks(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({
            error: 'Internal server error',
            details: errorMessage
        });
        expect(Book.getAll).toHaveBeenCalledTimes(1);
    });

    it('getAllBooks should return 404 when no books are found', async () => {
        Book.getAll.mockResolvedValue([]);
        
        await bookController.getAllBooks(req, res);
        
        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({
            error: 'No books found'
        });
    });

    it('getAllBooks should return correct error structure', async () => {
        Book.getAll.mockRejectedValue(new Error('DB timeout'));
        
        await bookController.getAllBooks(req, res);
        
        const responseData = res._getJSONData();
        expect(responseData).toHaveProperty('error');
        expect(responseData).toHaveProperty('details');
    });

    it('getBookById should return a book with status 404 if book is not found', async () => {
        Book.getById.mockResolvedValue(undefined);

        const req = httpMocks.createRequest({ params: { id: '99' } });
        const res = httpMocks.createResponse();

        await bookController.getBookById(req, res);

        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({ message: 'Livro não encontrado' });
        expect(Book.getById).toHaveBeenCalledWith(99);
    });

    it('getByGenre should return an empty list with status 200 if no books of that genre are found', async () => {
        Book.getByGenre.mockResolvedValue([]);

        const req = httpMocks.createRequest({
            params: { genero: 'Gênero Z' },
        });
        const res = httpMocks.createResponse();

        await bookController.getByGenre(req, res);

        expect(res.statusCode).toBe(200);
        expect(res._getJSONData).toEqual({ books: [] });
        expect(Book.getByGenre).toHaveBeenCalledWith('Gênero Z');
        expect(Book.getByGenre).toHaveBeenCalledTimes(1);
    });

    it('getByGenre should return status 500 if an error occurs', async () => {
        Book.getByGenre.mockRejectedValue(new Error('Erro ao buscar livros'));

        const req = httpMocks.createRequest({
            params: { genero: 'Gênero F' },
        });
        const res = httpMocks.createResponse();
    
        await bookController.getByGenre(req, res);
    
        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Erro ao buscar livros' });
        expect(Book.getByGenre).toHaveBeenCalledWith('Gênero F');
        expect(Book.getByGenre).toHaveBeenCalledTimes(1);
    });

    it('addBook should return status 400 if data is invalid', async () => {
        const invalidBookData = { titulo: 'Livro R', autor: 'Autor Y', genero: 'Gênero C', ano_publicacao: 1999 };
      
        const req = httpMocks.createRequest({
          method: 'POST',
          url: '/books',
          body: invalidBookData,
        });
        const res = httpMocks.createResponse();
      
        await bookController.create(req, res);
      
        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toHaveProperty('error');
        expect(res._getJSONData().error).toContain('Título é obrigatório');
        expect(Book.create).not.toHaveBeenCalled();
    });

    it('addBook should return status 500 if database operation fails', async () => {
        const newBookData = { titulo: 'Livro B', autor: 'Autor X', genero: 'Gênero B', ano_publicacão: 2022 };
        const mockError = new Error('Erro ao salvar no banco de dados');
        Book.create.mockRejectedValue(mockError);
      
        const req = httpMocks.createRequest({
          method: 'POST',
          url: '/books',
          body: newBookData,
        });
        const res = httpMocks.createResponse();
      
        await bookController.create(req, res);
      
        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toHaveProperty('error');
        expect(res._getJSONData().error).toBe('Erro ao criar o livro');
        expect(Book.create).toHaveBeenCalledTimes(1);
        expect(Book.create).toHaveBeenCalledWith(newBookData);
    });

    it('updateBook should return status 404 if the book to update is not found', async () => {
        const bookId = 4;
        const updatedBookData = { titulo: 'Novo Título' };
        Book.findById.mockResolvedValue(null);
    
        const req = httpMocks.createRequest({
            params: { id: bookId },
            body: updatedBookData,
        });
        const res = httpMocks.createResponse();
    
        await bookController.update(req, res);
    
        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({ message: 'Livro não encontrado' });
        expect(Book.findById).toHaveBeenCalledWith(bookId);
        expect(Book.findById).toHaveBeenCalledTimes(1);
        expect(Book.update).not.toHaveBeenCalled();
    });

    it('updateBook should return status 500 if an error occurs during update', async () => {
        const bookId = 5;
        const updatedBookData = { titulo: 'Novo Título' };
        Book.findById.mockResolvedValue({ id: bookId, titulo: 'Título Antigo', autor: 'Autor X', genero: 'Gênero C', ano_publicacão: 2010 });
        Book.update.mockRejectedValue(new Error('Erro ao atualizar livro'));
    
        const req = httpMocks.createRequest({
            params: { id: bookId },
            body: updatedBookData,
        });
        const res = httpMocks.createResponse();
    
        await bookController.update(req, res);
    
        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Erro ao atualizar livro' }); 
        expect(Book.findById).toHaveBeenCalledWith(bookId);
        expect(Book.findById).toHaveBeenCalledTimes(1);
        expect(Book.update).toHaveBeenCalledWith(bookId, updatedBookData);
        expect(Book.update).toHaveBeenCalledTimes(1);
    });

    it('deleteBook should return status 404 if the book to delete is not found (destroy returns 0)', async () => {
        const bookId = 7;
        Book.destroy.mockResolvedValue(0); // Simula que nenhum registro foi deletado
    
        const req = httpMocks.createRequest({
            params: { id: bookId },
        });
        const res = httpMocks.createResponse();
    
        await bookController.delete(req, res);
    
        expect(res.statusCode).toBe(404);
        expect(res._getJSONData()).toEqual({ message: 'Livro não encontrado' }); // Adapte a mensagem conforme sua implementação
        expect(Book.destroy).toHaveBeenCalledWith({ where: { id: bookId } });
        expect(Book.destroy).toHaveBeenCalledTimes(1);
    });

    it('deleteBook should return status 500 if an error occurs during deletion', async () => {
        const bookId = 8;
        Book.destroy.mockRejectedValue(new Error('Erro ao deletar livro'));
    
        const req = httpMocks.createRequest({
            params: { id: bookId },
        });
        const res = httpMocks.createResponse();
    
        await bookController.delete(req, res);
    
        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ message: 'Erro ao deletar livro' }); // Adapte a mensagem conforme sua implementação
        expect(Book.destroy).toHaveBeenCalledWith({ where: { id: bookId } });
        expect(Book.destroy).toHaveBeenCalledTimes(1);
    });
});

describe('Book Controller - getBooksPaginated', () => {
    it('should call Book.getAllPaginated with default page and limit if not provided', async () => {
        const mockResults = { items: [], totalItems: 0, totalPages: 1, currentPage: 1, pageSize: 10 };
        Book.getAllPaginated.mockResolvedValue(mockResults);

        const req = httpMocks.createRequest({ query: {} });
        const res = httpMocks.createResponse();

        await bookController.getBooksPaginated(req, res);

        expect(Book.getAllPaginated).toHaveBeenCalledWith(1, 10);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(mockResults);
    });

    it('should call Book.getAllPaginated with provided page and limit', async () => {
        const mockResults = { items: [], totalItems: 50, totalPages: 5, currentPage: 2, pageSize: 20 };
        Book.getAllPaginated.mockResolvedValue(mockResults);

        const req = httpMocks.createRequest({ query: { page: '2', limit: '20' } });
        const res = httpMocks.createResponse();

        await bookController.getBooksPaginated(req, res);

        expect(Book.getAllPaginated).toHaveBeenCalledWith(2, 20);
        expect(res.statusCode).toBe(200);
        expect(res._getJSONData()).toEqual(mockResults);
    });

    it('should return 400 if page parameter is invalid', async () => {
        const req = httpMocks.createRequest({ query: { page: 'abc' } });
        const res = httpMocks.createResponse();

        await bookController.getBooksPaginated(req, res);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Parâmetros de página ou limite inválidos.' });
        expect(Book.getAllPaginated).not.toHaveBeenCalled();
    });

    it('should return 400 if limit parameter is invalid', async () => {
        const req = httpMocks.createRequest({ query: { limit: 'xyz' } });
        const res = httpMocks.createResponse();

        await bookController.getBooksPaginated(req, res);

        expect(res.statusCode).toBe(400);
        expect(res._getJSONData()).toEqual({ error: 'Parâmetros de página ou limite inválidos.' });
        expect(Book.getAllPaginated).not.toHaveBeenCalled();
    });

    it('should handle errors from Book.getAllPaginated', async () => {
        const mockError = new Error('Model error');
        Book.getAllPaginated.mockRejectedValue(mockError);

        const req = httpMocks.createRequest({ query: { page: '1', limit: '10' } });
        const res = httpMocks.createResponse();

        await bookController.getBooksPaginated(req, res);

        expect(res.statusCode).toBe(500);
        expect(res._getJSONData()).toEqual({ error: 'Model error' });
    });
});