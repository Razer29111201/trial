// sidebar.js

// Sidebar HTML template
const sidebarHTML = `
 <aside class="sidebar">
                    <nav>
                        <ul class="sidebar-menu">
                            <li>
                                <a href="/index.html">
                                    <i class='bx bx-book'></i> Trải nghiệm</a>
                            </li>
                            <li class="submenu">
                                <a href="/gv.html">
                                    <i class='bx bxs-user'></i>
                                    Thông tin giáo viên
                                </a>
                                <ul class="sidebar-submenu">
                                    <li class="item_"> <i class='bx bx-list-ul'></i> Chỉ số giáo viên</li>
                                    <li class="item_ bg_sidebar"><i class='bx bxs-info-circle'></i> Thông tin giáo viên
                                    </li>
                                    <li class="item_"> <i class='bx bxs-check-square'></i> Giáo viên confirm</li>
                                </ul>
                            </li>
                        </ul>
                    </nav>
                </aside>
`;

// Function to add sidebar to the page
document.getElementById('sidebar').innerHTML = sidebarHTML;