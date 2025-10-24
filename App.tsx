import React, { useState, createContext, useContext, useEffect, useMemo, useCallback } from 'react';

const LOGO_URL = "/Logo.png";

// --- TYPES ---
interface CustomizationOption {
    name: string;
    extraCost: number;
}
interface Product {
    id: number;
    name: string;
    description: string;
    basePrice: number;
    image: string;
    category: 'Celebration Cakes' | 'Tea Time Cakes' | 'Cookies' | 'Healthy Treats';
    customizationOptions: {
        size?: CustomizationOption[];
        flavor?: CustomizationOption[];
        frosting?: CustomizationOption[];
        dietary?: CustomizationOption[];
        [key: string]: CustomizationOption[] | undefined;
    }
}

interface CartItem {
    product: Product;
    quantity: number;
    customizations: Record<string, CustomizationOption>;
    totalPrice: number;
    id: string;
}

interface User {
    id: number;
    name: string;
    email: string;
    phone: string;
    address: string;
    password?: string; // Optional for security, not stored in frontend state
}

interface Order {
    id: string;
    userId: number;
    customer: { name: string; phone: string; address: string };
    deliveryDateTime: string;
    items: CartItem[];
    total: number;
    status: 'New' | 'Confirmed' | 'In Progress' | 'Completed';
}

interface AppContextType {
    page: string;
    setPage: (page: string) => void;
    cart: CartItem[];
    addToCart: (item: CartItem) => void;
    removeFromCart: (itemId: string) => void;
    updateQuantity: (itemId: string, newQuantity: number) => void;
    clearCart: () => void;
    products: Product[];
    setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
    orders: Order[];
    addOrder: (order: Omit<Order, 'id' | 'status'>) => string;
    updateOrderStatus: (orderId: string, status: Order['status']) => void;
    users: User[];
    currentUser: User | null;
    login: (email: string, pass: string) => boolean;
    signup: (user: Omit<User, 'id'>) => boolean;
    logout: () => void;
    searchTerm: string;
    setSearchTerm: React.Dispatch<React.SetStateAction<string>>;
}

// --- HARDCODED DATA ---
const initialProducts: Product[] = []; // Products will be added by admin

// --- CONTEXT ---
const AppContext = createContext<AppContextType | null>(null);

const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [page, setPage] = useState('home');
    const [cart, setCart] = useState<CartItem[]>([]);
    const [products, setProducts] = useState<Product[]>(initialProducts);
    const [orders, setOrders] = useState<Order[]>([]);
    const [users, setUsers] = useState<User[]>([
        { id: 1, name: 'Admin', email: 'admin@bakeme.com', password: 'newpassword', phone: '', address: '' }
    ]);
    const [currentUser, setCurrentUser] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    const addToCart = (item: CartItem) => setCart(prev => [...prev, item]);
    const removeFromCart = (itemId: string) => setCart(prev => prev.filter(item => item.id !== itemId));
    const updateQuantity = (itemId: string, newQuantity: number) => {
        setCart(prev => prev.map(item => item.id === itemId ? { ...item, quantity: Math.max(1, newQuantity) } : item));
    };
    const clearCart = () => setCart([]);
    
    const addOrder = (order: Omit<Order, 'id' | 'status'>): string => {
        const orderId = `BMAW-${Date.now()}`;
        const newOrder: Order = { ...order, id: orderId, status: 'New' };
        setOrders(prev => [...prev, newOrder]);
        return orderId;
    };
    
    const updateOrderStatus = (orderId: string, status: Order['status']) => {
        setOrders(prev => prev.map(o => o.id === orderId ? {...o, status} : o));
    };

    const login = (email: string, pass: string): boolean => {
        const user = users.find(u => u.email === email && u.password === pass);
        if (user) {
            const { password, ...userToStore } = user; // Don't store password in currentUser
            setCurrentUser(userToStore);
            return true;
        }
        return false;
    };

    const signup = (userData: Omit<User, 'id'>): boolean => {
        if (users.some(u => u.email === userData.email)) return false; // Email exists
        const newUser = { ...userData, id: Date.now() };
        setUsers(prev => [...prev, newUser]);
        const { password, ...userToStore } = newUser;
        setCurrentUser(userToStore);
        return true;
    };
    
    const logout = () => {
        setCurrentUser(null);
        setPage('home');
    };

    return (
        <AppContext.Provider value={{
            page, setPage, cart, addToCart, removeFromCart, updateQuantity, clearCart, 
            products, setProducts, orders, addOrder, updateOrderStatus, users, currentUser,
            login, signup, logout, searchTerm, setSearchTerm
        }}>
            {children}
        </AppContext.Provider>
    );
};

const useAppContext = () => {
    const context = useContext(AppContext);
    if (!context) throw new Error('useAppContext must be used within an AppProvider');
    return context;
};

// --- HELPER COMPONENTS ---
const BrandedPlaceholder: React.FC<{ className?: string }> = ({ className }) => {
    return (
        <div className={`flex items-center justify-center bg-primary/30 ${className}`}>
            <div className="text-center opacity-60">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 md:h-16 md:w-16 mx-auto text-text-dark" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1">
                    <path d="M2 16.5A2.5 2.5 0 0 0 4.5 19h15a2.5 2.5 0 0 0 2.5-2.5V15H2v1.5Z" />
                    <path d="M20 8v3h-2V8" /><path d="M18 8V5c0-1.1-.9-2-2-2s-2 .9-2 2v3" />
                    <path d="M12 8V5c0-1.1-.9-2-2-2s-2 .9-2 2v3" /><path d="M8 8V5c0-1.1-.9-2-2-2s-2 .9-2 2v3" />
                    <path d="M20 15v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                </svg>
                <p className="font-display text-sm md:text-lg text-text-dark mt-2">Bake Me A Wish</p>
            </div>
        </div>
    );
};

const ImageWithPlaceholder: React.FC<{ src: string; alt: string; className: string; }> = ({ src, alt, className }) => {
    const [error, setError] = useState(!src);

    useEffect(() => {
        setError(!src);
    }, [src]);
    
    if (error) {
        return <BrandedPlaceholder className={className} />;
    }

    return <img src={src} alt={alt} className={className} onError={() => setError(true)} />;
};


const CartIcon: React.FC = () => {
    const { cart, setPage } = useAppContext();
    const itemCount = useMemo(() => cart.reduce((sum, item) => sum + item.quantity, 0), [cart]);

    return (
        <button onClick={() => setPage('cart')} className="relative p-2 hover:bg-primary/50 rounded-full transition-colors" aria-label={`Shopping cart with ${itemCount} items`}>
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            {itemCount > 0 && (
                <span className="absolute top-0 right-0 block h-5 w-5 rounded-full bg-accent text-white text-xs flex items-center justify-center">
                    {itemCount}
                </span>
            )}
        </button>
    );
};

const Header: React.FC = () => {
    const { setPage, currentUser, logout, searchTerm, setSearchTerm } = useAppContext();
    const [isMenuOpen, setIsMenuOpen] = useState(false);
    
    const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
        setSearchTerm(e.target.value);
        if (e.target.value) {
            setPage('shop');
        }
    };

    const navLinks = (
        <>
            <button onClick={() => { setPage('home'); setIsMenuOpen(false); }} className="hover:text-accent transition-colors py-2">Home</button>
            <button onClick={() => { setPage('shop'); setIsMenuOpen(false); }} className="hover:text-accent transition-colors py-2">Shop</button>
            <button onClick={() => { setPage('gallery'); setIsMenuOpen(false); }} className="hover:text-accent transition-colors py-2">Gallery</button>
            <button onClick={() => { setPage('contact'); setIsMenuOpen(false); }} className="hover:text-accent transition-colors py-2">Contact Us</button>
        </>
    );

    return (
        <header className="bg-secondary sticky top-0 z-10">
            <div className="max-w-6xl mx-auto flex items-center justify-between py-3 px-4">
                <a href="/" className="flex items-center gap-3">
                    <img src={LOGO_URL} alt="Bake Me A Wish Logo" className="h-8 w-auto" />
                </a>
                <div className="hidden lg:flex items-center space-x-8">
                    {navLinks}
                </div>
                <div className="flex items-center space-x-2 md:space-x-4">
                     <div className="relative hidden md:block">
                        <input 
                            type="text" 
                            placeholder="Search bakes..."
                            value={searchTerm}
                            onChange={handleSearch}
                            className="w-32 md:w-48 p-2 pl-8 border border-primary/50 rounded-full focus:outline-none focus:ring-2 focus:ring-accent transition-all"
                        />
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-primary absolute left-2 top-1/2 -translate-y-1/2" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path></svg>
                    </div>
                    <CartIcon />
                    {currentUser ? (
                         <div className="flex items-center space-x-2">
                             <button onClick={() => setPage('profile')} className="p-2 hover:bg-primary/50 rounded-full transition-colors" aria-label="User Profile">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-text-dark" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                            </button>
                            <button onClick={logout} className="hidden md:block bg-accent text-white px-3 py-1 rounded-full text-sm hover:bg-accent/90 transition-colors">Logout</button>
                         </div>
                    ) : (
                        <div className="hidden md:flex items-center space-x-2">
                            <button onClick={() => setPage('login')} className="px-3 py-1 rounded-full hover:bg-primary/50 transition-colors">Login</button>
                            <button onClick={() => setPage('signup')} className="bg-accent text-white px-3 py-1 rounded-full hover:bg-accent/90 transition-colors">Sign Up</button>
                        </div>
                    )}
                    <button className="lg:hidden p-2" onClick={() => setIsMenuOpen(!isMenuOpen)}>
                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
                    </button>
                </div>
            </div>
            {isMenuOpen && (
                 <div className="lg:hidden bg-background/95 flex flex-col items-center space-y-4 py-4 shadow-md">
                     {navLinks}
                     {!currentUser ? (
                        <>
                            <button onClick={() => { setPage('login'); setIsMenuOpen(false); }} className="w-full text-center py-2 hover:bg-primary/50">Login</button>
                            <button onClick={() => { setPage('signup'); setIsMenuOpen(false); }} className="w-full text-center py-2 bg-accent text-white hover:bg-accent/90">Sign Up</button>
                        </>
                     ) : (
                         <button onClick={() => { logout(); setIsMenuOpen(false); }} className="w-full text-center py-2 bg-accent text-white">Logout</button>
                     )}
                </div>
            )}
        </header>
    );
};

// --- PAGES ---
const StaticPage: React.FC<{title: string, children: React.ReactNode}> = ({ title, children }) => (
    <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl font-display text-center mb-12">{title}</h1>
        <div className="max-w-3xl mx-auto bg-secondary p-8 rounded-lg shadow-md">
            {children}
        </div>
    </div>
);

const HomePage: React.FC = () => {
    const { setPage, products } = useAppContext();
    const collections: Product['category'][] = ['Celebration Cakes', 'Tea Time Cakes', 'Cookies', 'Healthy Treats'];
    const featuredProducts = products.slice(0, 3);
    
    return (
        <main>
            <section className="relative py-20 lg:py-24 bg-primary/30">
                <div className="container mx-auto flex flex-col items-center justify-center text-center px-4">
                    <img src={LOGO_URL} alt="Bake Me A Wish Logo" className="h-48 w-48 md:h-56 md:w-56 mb-4"/>
                    <p className="font-sans text-xl md:text-2xl mt-2 text-text-light max-w-lg">
                        Handmade with love, our artisanal bakes are crafted to make every moment a celebration.
                    </p>
                    <button onClick={() => setPage('shop')} className="mt-8 bg-accent text-white font-bold py-3 px-8 rounded-full hover:bg-accent/90 transition-transform duration-300 hover:scale-105 shadow-lg">
                        Explore Our Creations
                    </button>
                </div>
            </section>

             <section className="py-16">
                <div className="container mx-auto px-6 text-center">
                    <h2 className="text-4xl font-display mb-12">Our Collections</h2>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                        {collections.map((c) => (
                            <div key={c} className="bg-secondary rounded-xl p-6 text-center hover:shadow-sm transition">
                              <CategoryIcon name={c} className="w-12 h-12 mx-auto mb-3 text-text-light" />
                              <div className="text-text-dark font-medium">{c}</div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {products.length > 0 && (
                <section className="py-16 bg-primary/30">
                    <div className="container mx-auto px-6 text-center">
                        <h2 className="text-4xl font-display mb-12">Best Sellers</h2>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                            {featuredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    </div>
                </section>
            )}
        </main>
    );
};

const ProductCard: React.FC<{product: Product}> = ({ product }) => {
    const { setPage } = useAppContext();
    return (
        <div onClick={() => setPage(`product/${product.id}`)} className="bg-secondary rounded-lg shadow-md overflow-hidden group cursor-pointer transform hover:-translate-y-2 transition-transform duration-300 hover:shadow-xl">
            <ImageWithPlaceholder src={product.image} alt={product.name} className="w-full h-64 object-cover"/>
            <div className="p-6 text-center">
                <h3 className="text-xl font-bold font-display text-text-dark mb-2">{product.name}</h3>
                <p className="text-accent font-semibold">
                    {Object.keys(product.customizationOptions).length > 0 ? `Starting at ₹${product.basePrice}` : `₹${product.basePrice}`}
                </p>
                <button className="mt-4 bg-accent text-white py-2 px-4 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 transform group-hover:translate-y-[-4px]">
                    View Details
                </button>
            </div>
        </div>
    );
}

const ShopPage: React.FC = () => {
    const { products, page, searchTerm } = useAppContext();
    const [selectedCategory, setSelectedCategory] = useState<string>('All');
    
    useEffect(() => {
        const categoryFromUrl = page.split('/')[1];
        if (categoryFromUrl) {
            setSelectedCategory(decodeURIComponent(categoryFromUrl));
        } else {
             setSelectedCategory('All');
        }
    }, [page]);
    
    const categories = ['All', ...Array.from(new Set(products.map(p => p.category)))];
    
    const filteredProducts = useMemo(() => {
        let prods = products;
        if (selectedCategory !== 'All') {
            prods = prods.filter(p => p.category === selectedCategory);
        }
        if(searchTerm) {
            prods = prods.filter(p => 
                p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                p.description.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }
        return prods;
    }, [products, selectedCategory, searchTerm]);
    
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-5xl font-display text-center mb-12">Our Bakes</h1>
            {products.length > 0 ? (
                <>
                    <div className="flex justify-center flex-wrap gap-4 mb-12">
                        {categories.map(cat => (
                            <button 
                                key={cat} 
                                onClick={() => setSelectedCategory(cat)}
                                className={`py-2 px-6 rounded-full transition-colors duration-300 ${selectedCategory === cat ? 'bg-text-dark text-background' : 'bg-primary/60 hover:bg-primary'}`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    {filteredProducts.length > 0 ? (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
                            {filteredProducts.map(product => (
                                <ProductCard key={product.id} product={product} />
                            ))}
                        </div>
                    ) : (
                         <div className="text-center py-16">
                            <h2 className="text-2xl font-bold font-display">No results found</h2>
                            <p className="text-text-light mt-2">Try adjusting your search or filters.</p>
                        </div>
                    )}
                </>
            ) : (
                <div className="text-center py-16">
                    <h2 className="text-3xl font-display">Our Kitchen is Warming Up!</h2>
                    <p className="text-text-light mt-2">Our admin is busy baking... No products have been added yet. Please check back soon!</p>
                </div>
            )}
        </div>
    );
};

const ProductDetailPage: React.FC = () => {
    const { page, products, addToCart, setPage } = useAppContext();
    const productId = parseInt(page.split('/')[1]);
    const product = products.find(p => p.id === productId);

    const [quantity, setQuantity] = useState(1);
    const [customizations, setCustomizations] = useState<Record<string, CustomizationOption>>({});
    const [totalPrice, setTotalPrice] = useState(product?.basePrice || 0);

    useEffect(() => {
        if (product) {
            let currentTotal = product.basePrice;
            Object.values(customizations).forEach(opt => {
                if (opt) currentTotal += opt.extraCost;
            });
            setTotalPrice(currentTotal * quantity);
        }
    }, [customizations, quantity, product]);
    
    if (!product) {
        return <div className="container mx-auto text-center py-20">Product not found. <button onClick={() => setPage('shop')} className="text-accent underline">Go back to shop</button></div>;
    }

    const handleCustomizationChange = (type: string, value: string) => {
        const options = product.customizationOptions[type];
        const selectedOption = options?.find(opt => opt.name === value);
        if (selectedOption) {
            setCustomizations(prev => ({ ...prev, [type]: selectedOption }));
        }
    };
    
    const handleAddToCart = () => {
        const finalPrice = totalPrice / quantity;
        const cartItem: CartItem = { product, quantity, customizations, totalPrice: finalPrice, id: `${product.id}-${Date.now()}` };
        addToCart(cartItem);
        setPage('cart');
    };
    
    const mandatoryOptions = Object.entries(product.customizationOptions).filter(([key, value]) => key !== 'dietary' && value && value.length > 0);
    const allMandatorySelected = mandatoryOptions.every(([key]) => customizations[key]);

    return (
        <div className="container mx-auto px-6 py-12">
            <div className="grid md:grid-cols-2 gap-12 items-start">
                <div>
                    <ImageWithPlaceholder src={product.image} alt={product.name} className="w-full rounded-lg shadow-lg"/>
                </div>
                <div>
                    <h1 className="text-4xl font-bold font-display text-text-dark mb-4">{product.name}</h1>
                    <p className="text-lg text-text-light mb-6">{product.description}</p>
                    <div className="space-y-4 mb-6">
                        {Object.entries(product.customizationOptions).map(([type, options]) => (
                            options && options.length > 0 && (
                                <div key={type}>
                                    <label className="block text-lg font-bold capitalize mb-2">{type}</label>
                                    <select onChange={e => handleCustomizationChange(type, e.target.value)} className="w-full p-3 bg-secondary border border-primary/50 rounded-lg focus:ring-2 focus:ring-accent focus:outline-none" defaultValue="">
                                        <option value="" disabled>Select {type}</option>
                                        {options?.map(opt => <option key={opt.name} value={opt.name}>{opt.name} (+₹{opt.extraCost})</option>)}
                                    </select>
                                </div>
                            )
                        ))}
                    </div>
                    <div className="flex items-center space-x-4 mb-6">
                        <label className="text-lg font-bold">Quantity:</label>
                        <button onClick={() => setQuantity(q => Math.max(1, q - 1))} className="bg-primary/60 hover:bg-primary h-10 w-10 rounded-full font-bold text-lg">-</button>
                        <span className="text-xl font-bold w-8 text-center">{quantity}</span>
                        <button onClick={() => setQuantity(q => q + 1)} className="bg-primary/60 hover:bg-primary h-10 w-10 rounded-full font-bold text-lg">+</button>
                    </div>
                    <div className="text-3xl font-bold text-accent mb-6">Total: ₹{totalPrice}</div>
                    <button onClick={handleAddToCart} disabled={!allMandatorySelected} className="w-full bg-accent text-white py-4 px-8 rounded-lg font-bold text-lg hover:bg-accent/90 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed">
                        {allMandatorySelected ? 'Add to Cart' : 'Please select all options'}
                    </button>
                </div>
            </div>
        </div>
    );
};

const CartPage: React.FC = () => {
    const { cart, removeFromCart, updateQuantity, setPage } = useAppContext();
    const subtotal = useMemo(() => cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0), [cart]);
    const deliveryFee = 50;
    const total = subtotal + deliveryFee;

    if (cart.length === 0) {
        return (
            <div className="container mx-auto text-center py-20">
                <h1 className="text-4xl font-display mb-4">Your Cart is Empty</h1>
                <p className="mb-8 text-text-light">Looks like you haven't added anything to your cart yet.</p>
                <button onClick={() => setPage('shop')} className="bg-accent text-white font-bold py-3 px-8 rounded-full hover:bg-accent/90 transition-colors">
                    Continue Shopping
                </button>
            </div>
        );
    }
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-5xl font-display text-center mb-12">Your Cart</h1>
            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-2 space-y-6">
                    {cart.map(item => (
                        <div key={item.id} className="flex flex-col sm:flex-row items-center bg-secondary p-4 rounded-lg shadow-sm gap-4">
                            <ImageWithPlaceholder src={item.product.image} alt={item.product.name} className="w-24 h-24 object-cover rounded-md"/>
                            <div className="flex-grow text-center sm:text-left">
                                <h2 className="text-lg font-bold">{item.product.name}</h2>
                                <div className="text-sm text-text-light">
                                    {Object.entries(item.customizations).map(([type, opt]) => (
                                        <p key={type}><span className="capitalize font-semibold">{type}:</span> {opt.name}</p>
                                    ))}
                                </div>
                                <p className="font-semibold text-accent">₹{item.totalPrice}</p>
                            </div>
                            <div className="flex items-center space-x-3">
                                <button onClick={() => updateQuantity(item.id, item.quantity - 1)} className="bg-primary/60 hover:bg-primary h-8 w-8 rounded-full font-bold">-</button>
                                <span className="font-bold w-8 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.id, item.quantity + 1)} className="bg-primary/60 hover:bg-primary h-8 w-8 rounded-full font-bold">+</button>
                            </div>
                             <p className="font-bold text-lg w-20 text-right">₹{item.totalPrice * item.quantity}</p>
                            <button onClick={() => removeFromCart(item.id)} className="p-2 text-text-light hover:text-red-500 rounded-full hover:bg-red-100">
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                            </button>
                        </div>
                    ))}
                </div>
                <div className="bg-secondary p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-2xl font-bold font-display mb-6">Order Summary</h2>
                    <div className="space-y-4 text-text-dark">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                        <div className="flex justify-between"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                        <hr className="border-primary/50" />
                        <div className="flex justify-between font-bold text-xl"><span>Total</span><span>₹{total}</span></div>
                    </div>
                    <button onClick={() => setPage('checkout')} className="w-full mt-8 bg-accent text-white py-3 rounded-lg font-bold text-lg hover:bg-accent/90 transition-colors">
                        Proceed to Checkout
                    </button>
                </div>
            </div>
        </div>
    );
};

const CheckoutPage: React.FC = () => {
    const { cart, addOrder, setPage, currentUser } = useAppContext();
    const [customerDetails, setCustomerDetails] = useState({ 
        name: currentUser?.name || '', 
        phone: currentUser?.phone || '', 
        address: currentUser?.address || '' 
    });
    const [deliveryDateTime, setDeliveryDateTime] = useState('');

    useEffect(() => {
        if(currentUser){
            setCustomerDetails({
                name: currentUser.name,
                phone: currentUser.phone,
                address: currentUser.address
            })
        }
    }, [currentUser])

    const subtotal = cart.reduce((sum, item) => sum + (item.totalPrice * item.quantity), 0);
    const deliveryFee = 50;
    const total = subtotal + deliveryFee;

    const getMinDateTime = useCallback(() => {
        const now = new Date();
        now.setHours(now.getHours() + 25);
        return now.toISOString().slice(0, 16);
    }, []);

    const handleProceed = () => {
        if (!customerDetails.name || !customerDetails.phone || !customerDetails.address || !deliveryDateTime) {
            alert('Please fill all fields');
            return;
        }
        
        const orderId = addOrder({
            userId: currentUser!.id,
            customer: customerDetails,
            deliveryDateTime,
            items: cart,
            total,
        });
        setPage(`confirm/${orderId}`);
    };

    if (!currentUser) {
        return (
            <div className="container mx-auto text-center py-20">
                <h1 className="text-4xl font-display mb-4">Please Login</h1>
                <p className="mb-8 text-text-light">You need to be logged in to proceed to checkout.</p>
                <button onClick={() => setPage('login')} className="bg-accent text-white font-bold py-3 px-8 rounded-full hover:bg-accent/90 transition-colors">
                    Login to Continue
                </button>
            </div>
        );
    }

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-5xl font-display text-center mb-12">Checkout</h1>
            <div className="grid lg:grid-cols-2 gap-12">
                <div className="bg-secondary p-8 rounded-lg shadow-md">
                    <h2 className="text-2xl font-bold font-display mb-6">Customer Details</h2>
                    <div className="space-y-4">
                        <input type="text" placeholder="Full Name" className="w-full p-3 bg-background border border-primary/50 rounded-lg" value={customerDetails.name} onChange={e => setCustomerDetails({...customerDetails, name: e.target.value})} />
                        <input type="tel" placeholder="Phone Number" className="w-full p-3 bg-background border border-primary/50 rounded-lg" value={customerDetails.phone} onChange={e => setCustomerDetails({...customerDetails, phone: e.target.value})} />
                        <textarea placeholder="Delivery Address" rows={3} className="w-full p-3 bg-background border border-primary/50 rounded-lg" value={customerDetails.address} onChange={e => setCustomerDetails({...customerDetails, address: e.target.value})}></textarea>
                    </div>
                    
                    <h2 className="text-2xl font-bold font-display mt-8 mb-4">Delivery Date & Time</h2>
                    <input type="datetime-local" className="w-full p-3 bg-background border border-primary/50 rounded-lg" min={getMinDateTime()} value={deliveryDateTime} onChange={e => setDeliveryDateTime(e.target.value)} />
                    <p className="text-sm text-accent mt-2">Please note: We require a minimum of 25 hours' notice for all orders.</p>
                </div>
                <div className="bg-primary/30 p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-2xl font-bold font-display mb-6">Order Summary</h2>
                    <div className="space-y-2 mb-6">
                        {cart.map(item => (
                            <div key={item.id} className="flex justify-between text-sm">
                                <span>{item.product.name} x {item.quantity}</span>
                                <span className="font-semibold">₹{item.totalPrice * item.quantity}</span>
                            </div>
                        ))}
                    </div>
                     <div className="space-y-4">
                        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal}</span></div>
                        <div className="flex justify-between"><span>Delivery Fee</span><span>₹{deliveryFee}</span></div>
                        <hr className="border-primary/50" />
                        <div className="flex justify-between font-bold text-xl"><span>Total</span><span>₹{total}</span></div>
                    </div>
                    <button onClick={handleProceed} className="w-full mt-8 bg-accent text-white py-3 rounded-lg font-bold text-lg hover:bg-accent/90 transition-colors">
                        Proceed to Payment
                    </button>
                </div>
            </div>
        </div>
    );
};

const ConfirmationPage: React.FC = () => {
    const { orders, clearCart, page } = useAppContext();
    const orderId = page.split('/')[1];
    const order = orders.find(o => o.id === orderId) || orders[orders.length - 1];

    useEffect(() => {
        clearCart();
    }, [clearCart]);

    if (!order) return <div className="text-center py-20">Loading order details...</div>;

    const generateWhatsAppMessage = () => {
        const itemsText = order.items.map(item => {
            const customText = Object.values(item.customizations).map(c => c.name).join(', ');
            return `${item.product.name}${customText ? ` (${customText})` : ''} x${item.quantity}`;
        }).join('%0A');

        const message = `Hello Bake Me A Wish!%0A%0AI've just placed an order and completed the payment.%0A%0A*My Order Details:*%0A*Order ID:* ${order.id}%0A*Customer:* ${order.customer.name}%0A*Phone:* ${order.customer.phone}%0A*Delivery Date:* ${new Date(order.deliveryDateTime).toLocaleString()}%0A%0A*Items:*%0A${itemsText}%0A%0A*Total Amount:* ₹${order.total}%0A%0APlease find my payment screenshot attached to confirm.`;
        
        return `https://wa.me/7705982880?text=${message}`;
    };

    return (
        <div className="container mx-auto px-6 py-12 text-center">
            <h1 className="text-5xl font-display mb-4">Complete Your Order</h1>
            <p className="text-lg mb-8 text-text-light">Your order has been placed successfully. Please complete the payment to confirm.</p>
            <div className="max-w-md mx-auto bg-secondary p-8 rounded-lg shadow-lg">
                <h2 className="text-2xl font-bold font-display mb-4">Payment Instructions</h2>
                <p className="mb-4">Please pay <span className="font-bold text-2xl text-accent">₹{order.total}</span> via UPI to:</p>
                <p className="font-mono bg-primary/30 text-text-dark tracking-wider p-3 rounded-lg mb-4 text-lg">bakemeawish@upi</p>
                <p>or scan the QR code below</p>
                <img src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=upi://pay?pa=bakemeawish@upi%26pn=Bake%20Me%20A%20Wish%26am=${order.total}`} alt="QR Code" className="mx-auto my-4 border-4 border-primary p-1 rounded-lg" />
                <a href={generateWhatsAppMessage()} target="_blank" rel="noopener noreferrer" className="block w-full mt-8 bg-green-500 text-white py-4 rounded-lg font-bold text-lg hover:bg-green-600 transition-colors">
                    I Have Paid - Confirm on WhatsApp
                </a>
            </div>
        </div>
    );
};

const AuthFormWrapper: React.FC<{title: string, children: React.ReactNode, onSubmit: (e: React.FormEvent) => void}> = ({ title, children, onSubmit }) => (
    <div className="min-h-[70vh] container mx-auto flex items-center justify-center py-12">
        <form onSubmit={onSubmit} className="bg-secondary p-8 rounded-lg shadow-md w-full max-w-sm">
            <img src={LOGO_URL} alt="Logo" className="h-24 w-24 mx-auto mb-4" />
            <h1 className="text-3xl font-bold font-display text-center mb-6">{title}</h1>
            {children}
        </form>
    </div>
)

const LoginPage: React.FC = () => {
    const { login, setPage } = useAppContext();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (login(email, password)) {
            if (email === 'admin@bakeme.com') {
                setPage('admin');
            } else {
                setPage('home');
            }
        } else {
            setError('Invalid email or password.');
        }
    };

    return (
        <AuthFormWrapper title="Login" onSubmit={handleLogin}>
            <div className="space-y-4">
                <input type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
                <input type="password" placeholder="Password" value={password} onChange={e => setPassword(e.target.value)} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
            </div>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <button type="submit" className="w-full mt-6 bg-accent text-white py-3 rounded-lg font-bold hover:bg-accent/90 transition-colors">Login</button>
            <p className="text-center mt-4 text-sm text-text-light">Don't have an account? <button onClick={() => setPage('signup')} className="text-accent font-bold">Sign Up</button></p>
        </AuthFormWrapper>
    );
};

const SignupPage: React.FC = () => {
    const { signup, setPage } = useAppContext();
    const [formData, setFormData] = useState({ name: '', email: '', password: '', phone: '', address: '' });
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSignup = (e: React.FormEvent) => {
        e.preventDefault();
        if (signup(formData)) {
            setPage('home');
        } else {
            setError('An account with this email already exists.');
        }
    };

    return (
        <AuthFormWrapper title="Create Account" onSubmit={handleSignup}>
            <div className="space-y-4">
                <input name="name" type="text" placeholder="Full Name" onChange={handleChange} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
                <input name="email" type="email" placeholder="Email Address" onChange={handleChange} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
                <input name="password" type="password" placeholder="Password" onChange={handleChange} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
                <input name="phone" type="tel" placeholder="Phone Number" onChange={handleChange} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
                <textarea name="address" placeholder="Default Delivery Address" rows={3} onChange={handleChange} className="w-full p-3 bg-background border border-primary/50 rounded-lg" required />
            </div>
            {error && <p className="text-red-500 text-sm mt-4 text-center">{error}</p>}
            <button type="submit" className="w-full mt-6 bg-accent text-white py-3 rounded-lg font-bold hover:bg-accent/90 transition-colors">Sign Up</button>
            <p className="text-center mt-4 text-sm text-text-light">Already have an account? <button onClick={() => setPage('login')} className="text-accent font-bold">Login</button></p>
        </AuthFormWrapper>
    );
};

const ProfilePage: React.FC = () => {
    const { currentUser, orders } = useAppContext();
    const userOrders = orders.filter(o => o.userId === currentUser?.id).sort((a,b) => new Date(b.deliveryDateTime).getTime() - new Date(a.deliveryDateTime).getTime());

    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-5xl font-display text-center mb-12">My Profile</h1>
            <div className="grid lg:grid-cols-3 gap-12">
                <div className="lg:col-span-1 bg-secondary p-6 rounded-lg shadow-md h-fit">
                    <h2 className="text-2xl font-bold font-display mb-4">{currentUser?.name}</h2>
                    <p className="text-text-light">{currentUser?.email}</p>
                    <p className="text-text-light">{currentUser?.phone}</p>
                    <p className="text-text-light mt-2">{currentUser?.address}</p>
                </div>
                <div className="lg:col-span-2 bg-secondary p-6 rounded-lg shadow-md">
                     <h2 className="text-2xl font-bold font-display mb-4">My Order History</h2>
                     <div className="space-y-4">
                         {userOrders.length > 0 ? userOrders.map(order => (
                             <div key={order.id} className="border border-primary/50 p-4 rounded-lg">
                                 <div className="flex justify-between items-start">
                                     <div>
                                         <p className="font-bold">Order ID: <span className="font-mono text-sm">{order.id}</span></p>
                                         <p className="text-sm text-text-light">Date: {new Date(order.deliveryDateTime).toLocaleDateString()}</p>
                                     </div>
                                     <span className={`px-3 py-1 text-sm rounded-full ${order.status === 'Completed' ? 'bg-green-100 text-green-800' : order.status === 'Confirmed' ? 'bg-blue-100 text-blue-800' : 'bg-yellow-100 text-yellow-800'}`}>{order.status}</span>
                                 </div>
                                 <hr className="my-2 border-primary/30"/>
                                 <ul className="text-sm list-disc list-inside">
                                     {order.items.map(item => <li key={item.id}>{item.product.name} x {item.quantity}</li>)}
                                 </ul>
                                 <p className="text-right font-bold mt-2">Total: ₹{order.total}</p>
                             </div>
                         )) : <p>You haven't placed any orders yet.</p>}
                     </div>
                </div>
            </div>
        </div>
    );
};

const OrderManagement: React.FC<{orders: Order[], updateOrderStatus: AppContextType['updateOrderStatus']}> = ({ orders, updateOrderStatus }) => (
    <div className="bg-secondary p-8 rounded-lg shadow-md mb-12">
        <h2 className="text-3xl font-bold font-display mb-6">Order Management</h2>
        <div className="overflow-x-auto">
            {orders.length > 0 ? (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-primary/50"><th className="p-2">Order ID</th><th className="p-2">Customer</th><th className="p-2">Total</th><th className="p-2">Status</th><th className="p-2">Action</th></tr></thead>
                    <tbody>
                        {orders.map(order => (
                            <tr key={order.id} className="border-b border-primary/30">
                                <td className="p-2 font-mono text-sm">{order.id}</td><td className="p-2">{order.customer.name}</td><td className="p-2">₹{order.total}</td><td className="p-2 font-semibold">{order.status}</td>
                                <td className="p-2">
                                    <select value={order.status} onChange={(e) => updateOrderStatus(order.id, e.target.value as Order['status'])} className="p-1 bg-background border border-primary/50 rounded">
                                        <option>New</option><option>Confirmed</option><option>In Progress</option><option>Completed</option>
                                    </select>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p className="text-center py-4">No orders yet.</p>}
        </div>
    </div>
);

const ProductManagement: React.FC<{products: Product[], onAdd: () => void, onEdit: (p: Product) => void, onDelete: (id: number) => void}> = ({ products, onAdd, onEdit, onDelete }) => (
    <div className="bg-secondary p-8 rounded-lg shadow-md">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold font-display">Product Management</h2>
            <button onClick={onAdd} className="bg-accent text-white py-2 px-4 rounded-lg font-bold hover:bg-accent/90 transition-colors">Add New Product</button>
        </div>
        <div className="overflow-x-auto">
            {products.length > 0 ? (
                <table className="w-full text-left">
                    <thead><tr className="border-b border-primary/50"><th className="p-2">ID</th><th className="p-2">Name</th><th className="p-2">Category</th><th className="p-2">Base Price</th><th className="p-2">Actions</th></tr></thead>
                    <tbody>
                        {products.map(product => (
                            <tr key={product.id} className="border-b border-primary/30">
                                <td className="p-2">{product.id}</td><td className="p-2 font-semibold">{product.name}</td><td className="p-2">{product.category}</td><td className="p-2">₹{product.basePrice}</td>
                                <td className="p-2 space-x-2">
                                    <button onClick={() => onEdit(product)} className="text-blue-500 hover:underline text-sm">Edit</button>
                                    <button onClick={() => onDelete(product.id)} className="text-red-500 hover:underline text-sm">Delete</button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            ) : <p className="text-center py-4">No products created yet. Click 'Add New Product' to begin.</p>}
        </div>
    </div>
);

const ProductModal: React.FC<{product: Product | null, onClose: () => void, setProducts: AppContextType['setProducts']}> = ({ product, onClose, setProducts }) => {
    const isEditing = product !== null;
    const [formData, setFormData] = useState<Omit<Product, 'id'>>(isEditing ? { ...product } : { name: '', description: '', basePrice: 0, image: '', category: 'Celebration Cakes', customizationOptions: {} });

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: name === 'basePrice' ? parseFloat(value) : value }));
    };

    const handleOptionChange = (type: string, index: number, field: 'name' | 'extraCost', value: string) => {
        const updatedOptions = [...(formData.customizationOptions[type] || [])];
        updatedOptions[index] = { ...updatedOptions[index], [field]: field === 'extraCost' ? parseFloat(value) : value };
        setFormData(prev => ({ ...prev, customizationOptions: { ...prev.customizationOptions, [type]: updatedOptions } }));
    };

    const addOption = (type: string) => {
        const newOptions = [...(formData.customizationOptions[type] || []), { name: '', extraCost: 0 }];
        setFormData(prev => ({ ...prev, customizationOptions: { ...prev.customizationOptions, [type]: newOptions } }));
    };

    const removeOption = (type: string, index: number) => {
        const updatedOptions = (formData.customizationOptions[type] || []).filter((_, i) => i !== index);
        setFormData(prev => ({ ...prev, customizationOptions: { ...prev.customizationOptions, [type]: updatedOptions } }));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (isEditing) {
            setProducts(prev => prev.map(p => p.id === product.id ? { ...formData, id: product.id } : p));
        } else {
            setProducts(prev => [...prev, { ...formData, id: Date.now() }]);
        }
        onClose();
    };

    const optionTypes = ['size', 'flavor', 'frosting', 'dietary'];

    return (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-secondary rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                 <form onSubmit={handleSubmit}>
                    <div className="p-6 sticky top-0 bg-secondary border-b border-primary/50">
                        <h2 className="text-2xl font-bold font-display">{isEditing ? 'Edit Product' : 'Add New Product'}</h2>
                    </div>
                    <div className="p-6 space-y-4">
                        <input name="name" value={formData.name} onChange={handleChange} placeholder="Product Name" className="w-full p-2 border border-primary/50 bg-background rounded" required />
                        <textarea name="description" value={formData.description} onChange={handleChange} placeholder="Description" className="w-full p-2 border border-primary/50 bg-background rounded" required />
                        <input name="basePrice" value={formData.basePrice} type="number" onChange={handleChange} placeholder="Base Price" className="w-full p-2 border border-primary/50 bg-background rounded" required />
                        <input name="image" value={formData.image} onChange={handleChange} placeholder="Image URL" className="w-full p-2 border border-primary/50 bg-background rounded" />
                        <select name="category" value={formData.category} onChange={handleChange} className="w-full p-2 border border-primary/50 bg-background rounded">
                            <option>Celebration Cakes</option><option>Tea Time Cakes</option><option>Cookies</option><option>Healthy Treats</option>
                        </select>
                        
                        <h3 className="text-lg font-bold font-display pt-4">Customization Options</h3>
                        {optionTypes.map(type => (
                            <div key={type} className="border border-primary/30 p-3 rounded-md">
                                <h4 className="font-semibold capitalize mb-2">{type}</h4>
                                {formData.customizationOptions[type]?.map((opt, index) => (
                                    <div key={index} className="flex items-center gap-2 mb-2">
                                        <input value={opt.name} onChange={e => handleOptionChange(type, index, 'name', e.target.value)} placeholder="Option Name" className="w-full p-2 border border-primary/50 bg-background rounded" />
                                        <input value={opt.extraCost} type="number" onChange={e => handleOptionChange(type, index, 'extraCost', e.target.value)} placeholder="Extra Cost" className="w-48 p-2 border border-primary/50 bg-background rounded" />
                                        <button type="button" onClick={() => removeOption(type, index)} className="text-red-500 p-2">✕</button>
                                    </div>
                                ))}
                                <button type="button" onClick={() => addOption(type)} className="text-sm text-blue-600">+ Add {type} option</button>
                            </div>
                        ))}
                    </div>
                     <div className="p-6 flex justify-end gap-4 sticky bottom-0 bg-secondary border-t border-primary/50">
                        <button type="button" onClick={onClose} className="py-2 px-4 rounded bg-primary/60 hover:bg-primary">Cancel</button>
                        <button type="submit" className="py-2 px-4 rounded bg-accent text-white hover:bg-accent/90">{isEditing ? 'Save Changes' : 'Add Product'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const AdminPanel: React.FC = () => {
    const { orders, updateOrderStatus, products, setProducts } = useAppContext();
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);

    const openAddModal = () => {
        setEditingProduct(null);
        setShowModal(true);
    };

    const openEditModal = (product: Product) => {
        setEditingProduct(product);
        setShowModal(true);
    };

    const handleDeleteProduct = (id: number) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            setProducts(prev => prev.filter(p => p.id !== id));
        }
    };
    
    return (
        <div className="container mx-auto px-6 py-12">
            <h1 className="text-5xl font-display text-center mb-12">Admin Panel</h1>
            <OrderManagement orders={orders} updateOrderStatus={updateOrderStatus} />
            <ProductManagement products={products} onAdd={openAddModal} onEdit={openEditModal} onDelete={handleDeleteProduct} />
            {showModal && <ProductModal product={editingProduct} onClose={() => setShowModal(false)} setProducts={setProducts} />}
        </div>
    );
};


// --- MAIN APP COMPONENT ---
function App() {
    return (
        <AppProvider>
            <MainContent />
        </AppProvider>
    );
}

const MainContent: React.FC = () => {
    const { page, currentUser } = useAppContext();

    const renderPage = () => {
        const pageName = page.split('/')[0];
        
        switch (pageName) {
            case 'home': return <HomePage />;
            case 'shop': return <ShopPage />;
            case 'product': return <ProductDetailPage />;
            case 'cart': return <CartPage />;
            case 'checkout': return <CheckoutPage />;
            case 'confirm': return <ConfirmationPage />;
            case 'login': return <LoginPage />;
            case 'signup': return <SignupPage />;
            case 'profile': return currentUser ? <ProfilePage /> : <LoginPage />;
            case 'admin': return currentUser?.email === 'admin@bakeme.com' ? <AdminPanel /> : <HomePage />;
            case 'gallery': return <StaticPage title="Gallery"><p className="text-center">Our beautiful creations will be displayed here soon!</p></StaticPage>;
            case 'contact': return <StaticPage title="Contact Us">
                <div className="text-center space-y-4">
                    <p><strong>Email:</strong> contact@bakemeawish.example.com</p>
                    <p><strong>Phone:</strong> +91 77059 82880</p>
                    <a href="https://wa.me/7705982880" target="_blank" rel="noopener noreferrer" className="inline-block mt-4 bg-green-500 text-white py-3 px-6 rounded-lg font-bold hover:bg-green-600 transition-colors">
                        Chat with us on WhatsApp
                    </a>
                </div>
            </StaticPage>;
            default: return <HomePage />;
        }
    };
    
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <div className="flex-grow">
                {renderPage()}
            </div>
             <footer className="bg-primary text-text-dark mt-12 py-8">
                <div className="container mx-auto text-center">
                    <p>&copy; {new Date().getFullYear()} Bake Me A Wish. All Rights Reserved.</p>
                </div>
            </footer>
        </div>
    );
}

export default App;

// Inline category icons to replace missing external SVGs
const CategoryIcon: React.FC<{ name: Product['category']; className?: string }> = ({ name, className = "w-12 h-12 text-text-light" }) => {
  switch (name) {
    case 'Celebration Cakes':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 3v4M8 11h8a3 3 0 0 1 3 3v5H5v-5a3 3 0 0 1 3-3z" />
          <path d="M8 16c1 .8 2 .8 3 0s2-.8 3 0 2 .8 3 0" />
        </svg>
      );
    case 'Tea Time Cakes':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 10h13v3a5 5 0 0 1-5 5H8a5 5 0 0 1-5-5v-3z" />
          <path d="M16 11h2a3 3 0 1 1 0 6h-2" />
          <path d="M7 6s2 0 2 2-2 2-2 4" />
        </svg>
      );
    case 'Cookies':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="12" cy="12" r="7" />
          <circle cx="10" cy="10" r="1" />
          <circle cx="14" cy="8" r="1" />
          <circle cx="15" cy="13" r="1" />
          <circle cx="9" cy="14" r="1" />
        </svg>
      );
    case 'Healthy Treats':
      return (
        <svg viewBox="0 0 24 24" className={className} fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M12 21c4-3 7-6 7-10a7 7 0 0 0-7-7 7 7 0 0 0-7 7c0 4 3 7 7 10z" />
          <path d="M9 11c1-2 3-3 6-3" />
        </svg>
      );
    default:
      return null;
  }
};
