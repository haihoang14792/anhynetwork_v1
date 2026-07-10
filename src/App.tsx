/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useMemo } from 'react';
import { db, auth } from './firebase';
import { 
  collection, 
  onSnapshot, 
  doc, 
  setDoc, 
  deleteDoc, 
  updateDoc,
  getDoc
} from 'firebase/firestore';
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  updateProfile
} from 'firebase/auth';
import {
  Play,
  Settings,
  Calendar,
  Users,
  TrendingUp,
  Eye,
  Video,
  Send,
  X,
  ExternalLink,
  Plus,
  Trash2,
  Heart,
  MessageSquare,
  Globe,
  Check,
  Sparkles,
  Info,
  Layers,
  Clock,
  Briefcase,
  Youtube,
  Bell,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Lock
} from 'lucide-react';

// Define TS Interfaces
interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  role: 'admin' | 'editor' | 'viewer';
  createdAt: string;
}

interface Channel {
  id: string;
  name: string;
  emoji: string;
  subscribers: string;
  growth: string;
  views: string;
  description: string;
  tag: string;
  accent: string;
  colorClass: string;
  channelUrl?: string;
  subscribeUrl?: string;
}

interface VideoClip {
  id: string;
  channelId: string;
  title: string;
  url: string;
  description: string;
  duration: string;
  quality: string;
  views: string;
  likes: number;
  thumbnailGradient: string;
}

interface Comment {
  id: string;
  videoId: string;
  author: string;
  text: string;
  timestamp: string;
  likes: number;
}

interface Booking {
  id: string;
  fullName: string;
  email: string;
  companyName: string;
  purpose: string;
  message: string;
  timestamp: string;
}

// Default initial data
const DEFAULT_CHANNELS: Channel[] = [
  {
    id: 'v-tech',
    name: 'AnHy Tech & AI',
    emoji: '🤖',
    subscribers: '850K',
    growth: '+18% this month',
    views: '12.4M',
    description: 'Khám phá về AI Agents, tự động hóa quy trình phần mềm và công nghệ điện toán tương lai.',
    tag: 'AI & SOFTWARE',
    accent: 'indigo',
    colorClass: 'from-indigo-600 to-indigo-800',
    channelUrl: 'https://www.youtube.com/@v_tech_ai',
    subscribeUrl: 'https://www.youtube.com/@v_tech_ai?sub_confirmation=1'
  },
  {
    id: 'v-life',
    name: 'AnHy Life & Travel',
    emoji: '🍳',
    subscribers: '1.2M',
    growth: '+8% this month',
    views: '45.1M',
    description: 'Trải nghiệm ẩm thực đường phố, văn hóa địa phương và những hành trình du lịch đầy cảm hứng.',
    tag: 'LIFESTYLE & TRAVEL',
    accent: 'amber',
    colorClass: 'from-amber-500 to-amber-700',
    channelUrl: 'https://www.youtube.com/@v_life_travel',
    subscribeUrl: 'https://www.youtube.com/@v_life_travel?sub_confirmation=1'
  },
  {
    id: 'v-finance',
    name: 'AnHy Finance',
    emoji: '💸',
    subscribers: '420K',
    growth: '+24% this month',
    views: '5.8M',
    description: 'Giải mã quỹ chỉ số, cách quản lý tài chính cá nhân và xây dựng khối tài sản bền vững.',
    tag: 'WEALTH & FINANCE',
    accent: 'emerald',
    colorClass: 'from-emerald-500 to-emerald-700',
    channelUrl: 'https://www.youtube.com/@v_finance',
    subscribeUrl: 'https://www.youtube.com/@v_finance?sub_confirmation=1'
  }
];

const DEFAULT_VIDEOS: VideoClip[] = [
  {
    id: 'vid-1',
    channelId: 'v-tech',
    title: 'The Future of AI Architecture in 2026',
    url: 'https://www.youtube.com/watch?v=Ke90Tje7VS0',
    description: 'Tìm hiểu cách các hệ thống AI Agent thông minh đang dẫn đầu cuộc cách mạng tiếp theo trong tự động hóa không gian làm việc số và kỹ thuật đám mây.',
    duration: '12:44',
    quality: '4K HDR',
    views: '240K lượt xem',
    likes: 18420,
    thumbnailGradient: 'from-slate-950 via-indigo-950/40 to-slate-900'
  },
  {
    id: 'vid-2',
    channelId: 'v-tech',
    title: 'React 19 & Next.js 15: Deep Dive Tutorial',
    url: 'https://www.youtube.com/watch?v=8S0UfX6pYps',
    description: 'Hướng dẫn toàn diện về Server Actions, useActionState, hook mới và bộ biên dịch React Compiler hoạt động thực tế.',
    duration: '18:20',
    quality: '1080p',
    views: '180K lượt xem',
    likes: 12510,
    thumbnailGradient: 'from-slate-950 via-blue-950/40 to-slate-900'
  },
  {
    id: 'vid-3',
    channelId: 'v-life',
    title: 'Ultimate Street Food Tour in New York & LA',
    url: 'https://www.youtube.com/watch?v=F_7OskP_tco',
    description: 'Hành trình trải nghiệm từ những chiếc xe đồ ăn đường phố nhộn nhịp đến các nhà hàng Michelin ẩn mình ở các thành phố lớn tại Hoa Kỳ.',
    duration: '24:10',
    quality: '4K HDR',
    views: '520K lượt xem',
    likes: 38240,
    thumbnailGradient: 'from-slate-950 via-amber-950/40 to-slate-900'
  },
  {
    id: 'vid-4',
    channelId: 'v-life',
    title: 'Exploring Secret Hidden Cafes in Saigon',
    url: 'https://www.youtube.com/watch?v=7h6B6Kq8nQY',
    description: 'Một chiếc vlog nhẹ nhàng thư giãn về văn hóa cà phê vỉa hè và những góc nhỏ bình yên giữa lòng Sài Gòn nhộn nhịp.',
    duration: '15:35',
    quality: '1080p',
    views: '310K lượt xem',
    likes: 19450,
    thumbnailGradient: 'from-slate-950 via-orange-950/40 to-slate-900'
  },
  {
    id: 'vid-5',
    channelId: 'v-finance',
    title: 'How to Invest in US Index Funds from Anywhere',
    url: 'https://www.youtube.com/watch?v=zjkBMFhNj_g',
    description: 'Phân tích chi tiết dành cho người mới bắt đầu về sức mạnh của lãi kép, các quỹ ETF hàng đầu thế giới và cách tự động hóa đầu tư tài chính.',
    duration: '11:05',
    quality: '4K',
    views: '150K lượt xem',
    likes: 9280,
    thumbnailGradient: 'from-slate-950 via-emerald-950/40 to-slate-900'
  }
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'c-1',
    videoId: 'vid-1',
    author: 'Minh Tuấn Tech',
    text: 'Bài phân tích siêu chất lượng! Công nghệ AI Agent đúng là tương lai của ngành phần mềm.',
    timestamp: '2 giờ trước',
    likes: 84
  },
  {
    id: 'c-2',
    videoId: 'vid-1',
    author: 'Sarah Jenkins',
    text: 'Loved the visual presentation of vertical city twin models. US urban projects are mind-blowing!',
    timestamp: '5 giờ trước',
    likes: 142
  },
  {
    id: 'c-3',
    videoId: 'vid-3',
    author: 'Lyly Foodie',
    text: 'Nhìn xe Taco thèm xỉu luôn anh ơi, lần sau review ẩm thực Boston nhé anh!',
    timestamp: '1 ngày trước',
    likes: 56
  },
  {
    id: 'c-4',
    videoId: 'vid-5',
    author: 'Quốc Bảo',
    text: 'Thông tin bổ ích và trực quan. Giúp mình có góc nhìn sáng suốt hơn về rủi ro lạm phát.',
    timestamp: '3 ngày trước',
    likes: 31
  }
];

const TRANSLATIONS = {
  en: {
    dashboard: 'Dashboard',
    myChannels: 'My Channels',
    collaborations: 'Collabs',
    contact: 'Contact',
    bookACall: 'BOOK A CALL',
    latestDrop: 'Featured Showcase',
    totalSubscribers: 'Total Subscribers',
    growthThisMonth: 'GROWTH THIS MONTH',
    liveStreaming: 'LIVE MASTERCLASS',
    masterclassTitle: 'Join the Weekend Masterclass',
    masterclassSub: 'Sundays at 10:00 AM EST',
    setReminder: 'Set Reminder',
    reminderActive: 'Reminder Active!',
    allChannels: 'All Channels Network',
    viewAll: 'Back to All',
    subscribers: 'Subscribers',
    views: 'Views',
    watchNow: 'Play Video',
    comments: 'Community Discussion',
    writeComment: 'Add a public comment...',
    send: 'Post',
    addChannel: 'Create Channel',
    editChannel: 'Edit Channel',
    creatorAdmin: 'Control Center',
    settings: 'Admin',
    bookingFormTitle: 'Schedule a Sponsorship or Collaboration',
    bookingSubtitle: 'Submit your pitch to integrate your brand or set up a collaborative YouTube video session.',
    fullName: 'Your Full Name',
    emailAddress: 'Contact Email',
    companyName: 'Company or Channel Name',
    purpose: 'Partnership Purpose',
    selectPurpose: 'Select an option',
    sponsorship: 'Brand Sponsorship',
    collab: 'Co-branded Video Collab',
    consultation: 'Channel Strategy Consult',
    message: 'Proposal & Budget details',
    submitBooking: 'Submit Proposal',
    bookingSuccessMsg: 'Your proposal was saved successfully! We will get in touch.',
    close: 'Close',
    adminPanelTitle: 'AnHy Network Settings',
    adminPanelSub: 'Configure your AnHy Network metrics, custom channels, showcase videos, and view sponsor proposals.',
    channelSettings: 'Channels list',
    videoSettings: 'Videos list',
    receivedBookings: 'Received Proposals',
    noBookings: 'No proposals received yet. Test by submitting the "Book a Call" form!',
    addVideo: 'Add Showcase Video',
    videoUrl: 'YouTube Link or Video ID',
    videoTitle: 'Video Title',
    videoDesc: 'Description',
    videoDuration: 'Duration (e.g., 14:15)',
    videoQuality: 'Quality Badge (e.g., 4K, 1080p)',
    delete: 'Delete',
    cancel: 'Cancel',
    saveChanges: 'Save Changes',
    backToDashboard: 'Back to Dashboard',
    resetToDefault: 'Reset to Factory Defaults',
    statsOverview: 'Global Creator Stats',
    activeVideos: 'Featured Videos Catalog',
    noVideos: 'No videos available for this channel.',
    enterYourName: 'Your Nickname',
    likesCount: 'Likes',
    justNow: 'Just now',
    reminderSetMsg: 'Masterclass reminder registered! We will notify you.',
    growthText: 'organic network growth',
    languageLabel: 'English',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    playVideoDesc: 'Click the play button to stream the video clip directly inside the bento panel.',
    backLabel: 'Back',
    creatorControl: 'Creator Panel',
    noChannels: 'No channels added yet. Add one in Settings!',
    visitChannel: 'Visit Channel',
    subscribeChannel: 'Subscribe',
    roleAdmin: '👑 Admin',
    roleEditor: '✍️ Editor',
    roleViewer: '👁️ Viewer',
    roleLabel: 'Role',
    permissionError: 'Permission Denied! Viewer cannot access the Admin panel.',
    channelPermissionError: 'Permission Denied! Only Administrators can manage channels.',
    videoPermissionError: 'Permission Denied! Only Admin or Editor can manage videos.',
    commentReplyLabel: 'Reply',
    login: 'Log In',
    register: 'Sign Up',
    logout: 'Log Out',
    email: 'Username / Tên đăng nhập',
    password: 'Password',
    name: 'Display Name',
    userManagement: 'User Management',
    switchRole: 'Set Role',
    noUsers: 'No users found.',
    updateRoleSuccess: 'User role updated successfully!',
    loginSuccess: 'Logged in successfully!',
    logoutSuccess: 'Logged out successfully!',
    registerSuccess: 'Registered successfully! Welcome to the network.',
    usersList: 'Users & Roles Management',
    userRoleChanged: 'User role updated to',
    adminOnly: 'Administrators Only'
  },
  vi: {
    dashboard: 'Tổng Quan',
    myChannels: 'Hệ Thống Kênh',
    collaborations: 'Hợp Tác',
    contact: 'Liên Hệ',
    bookACall: 'ĐẶT LỊCH HẸN',
    latestDrop: 'Video Đang Phát',
    totalSubscribers: 'Tổng Người Đăng Ký',
    growthThisMonth: 'TĂNG TRƯỞNG THÁNG NÀY',
    liveStreaming: 'PHÁT SÓNG TRỰC TIẾP',
    masterclassTitle: 'Lớp Học Chiến Lược Cuối Tuần',
    masterclassSub: 'Chủ Nhật lúc 10:00 AM EST (21:00 VN)',
    setReminder: 'Nhắc Tôi',
    reminderActive: 'Đã Đặt Nhắc Nhở!',
    allChannels: 'Mạng Lưới Tất Cả Kênh',
    viewAll: 'Quay Lại Tất Cả',
    subscribers: 'Người đăng ký',
    views: 'Lượt xem',
    watchNow: 'Phát Video',
    comments: 'Cộng Đồng Thảo Luận',
    writeComment: 'Viết bình luận công khai...',
    send: 'Gửi',
    addChannel: 'Tạo Kênh Mới',
    editChannel: 'Sửa Thông Tin Kênh',
    creatorAdmin: 'Bảng Điều Khiển',
    settings: 'Quản Trị',
    bookingFormTitle: 'Đăng Ký Tài Trợ & Hợp Tác',
    bookingSubtitle: 'Gửi đề xuất quảng cáo thương hiệu của bạn hoặc lên lịch ghi hình video chung cùng chúng tôi.',
    fullName: 'Họ và Tên của bạn',
    emailAddress: 'Email Liên Hệ',
    companyName: 'Tên Doanh Nghiệp / Kênh YouTube',
    purpose: 'Mục Đích Hợp Tác',
    selectPurpose: 'Chọn mục đích phù hợp',
    sponsorship: 'Hợp Tác Quảng Cáo (Sponsor)',
    collab: 'Quay Video Chung (Collab)',
    consultation: 'Tư Vấn Chiến Lược Riêng',
    message: 'Ý tưởng chi tiết & Ngân sách dự kiến',
    submitBooking: 'Gửi Đề Xuất',
    bookingSuccessMsg: 'Đề xuất đặt lịch của bạn đã được lưu! Chúng tôi sẽ phản hồi sớm nhất.',
    close: 'Đóng',
    adminPanelTitle: 'Trung Tâm Quản Trị AnHy Network',
    adminPanelSub: 'Cập nhật số liệu người đăng ký thực tế, cấu hình danh sách kênh AnHy Network, quản lý video và phê duyệt lịch hẹn.',
    channelSettings: 'Danh sách Kênh',
    videoSettings: 'Danh sách Video',
    receivedBookings: 'Yêu Cầu Hợp Tác Đã Nhận',
    noBookings: 'Chưa có yêu cầu nào. Hãy thử gửi thông tin qua form "Đặt Lịch Hẹn"!',
    addVideo: 'Thêm Video Trình Chiếu',
    videoUrl: 'Đường dẫn YouTube hoặc Video ID',
    videoTitle: 'Tiêu Đề Video',
    videoDesc: 'Mô tả ngắn',
    videoDuration: 'Thời lượng (ví dụ: 14:15)',
    videoQuality: 'Chất lượng (ví dụ: 4K, 1080p)',
    delete: 'Xóa',
    cancel: 'Hủy ý định',
    saveChanges: 'Lưu Thay Đổi',
    backToDashboard: 'Quay Lại Trang Chủ',
    resetToDefault: 'Khôi Phục Mặc Định ban đầu',
    statsOverview: 'Chỉ Số Toàn Bộ Mạng Lưới',
    activeVideos: 'Kho Video Đang Trình Chiếu',
    noVideos: 'Hiện tại chưa có video nào được thêm cho kênh này.',
    enterYourName: 'Biệt danh của bạn',
    likesCount: 'Lượt thích',
    justNow: 'Vừa xong',
    reminderSetMsg: 'Đã đăng ký nhắc nhở thành công! Bạn sẽ nhận thông báo qua email.',
    growthText: 'tỷ lệ mở rộng mạng lưới',
    languageLabel: 'Tiếng Việt',
    vietnamese: 'Tiếng Việt',
    english: 'English',
    playVideoDesc: 'Nhấp vào nút play để phát trực tiếp clip video YouTube ngay trên khung hình bento.',
    backLabel: 'Trở lại',
    creatorControl: 'Bảng Điều Khiển Admin',
    noChannels: 'Chưa có kênh nào được tạo. Hãy tạo thêm trong mục Cài đặt!',
    visitChannel: 'Truy cập kênh',
    subscribeChannel: 'Đăng ký kênh',
    roleAdmin: '👑 Admin (Quản trị)',
    roleEditor: '✍️ Editor (Biên tập)',
    roleViewer: '👁️ Viewer (Xem)',
    roleLabel: 'Vai trò',
    permissionError: 'Không có quyền! Vai trò Người Xem không được phép truy cập Bảng Điều Khiển.',
    channelPermissionError: 'Không có quyền! Chỉ Admin mới được phép thêm hoặc xóa kênh.',
    videoPermissionError: 'Không có quyền! Chỉ Admin hoặc Editor mới được thêm hoặc xóa video.',
    commentReplyLabel: 'Phản hồi',
    login: 'Đăng Nhập',
    register: 'Đăng Ký',
    logout: 'Đăng Xuất',
    email: 'Tên đăng nhập / Username',
    password: 'Mật khẩu',
    name: 'Tên hiển thị',
    userManagement: 'Quản lý người dùng',
    switchRole: 'Đặt quyền',
    noUsers: 'Không tìm thấy người dùng nào.',
    updateRoleSuccess: 'Cập nhật vai trò người dùng thành công!',
    loginSuccess: 'Đăng nhập thành công!',
    logoutSuccess: 'Đăng xuất thành công!',
    registerSuccess: 'Đăng ký tài khoản thành công! Chào mừng bạn.',
    usersList: 'Quản Lý Người Dùng & Phân Quyền',
    userRoleChanged: 'Đã chuyển vai trò người dùng sang',
    adminOnly: 'Chỉ dành cho Admin'
  }
};

export default function App() {
  // State initialization with safe default fallbacks
  const [channels, setChannels] = useState<Channel[]>(DEFAULT_CHANNELS);
  const [videos, setVideos] = useState<VideoClip[]>(DEFAULT_VIDEOS);
  const [comments, setComments] = useState<Comment[]>(DEFAULT_COMMENTS);
  const [bookings, setBookings] = useState<Booking[]>([]);

  const [activeChannelId, setActiveChannelId] = useState<string>('all');
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [language, setLanguage] = useState<'en' | 'vi'>('vi');
  const [reminderSet, setReminderSet] = useState<boolean>(false);
  const [activeTab, setActiveTab] = useState<'info' | 'comments'>('info');

  // Custom Masterclass configurations
  const [masterclassTitleVi, setMasterclassTitleVi] = useState<string>('');
  const [masterclassSubVi, setMasterclassSubVi] = useState<string>('');
  const [masterclassTitleEn, setMasterclassTitleEn] = useState<string>('');
  const [masterclassSubEn, setMasterclassSubEn] = useState<string>('');

  // New item creators state
  const [editingChannel, setEditingChannel] = useState<Partial<Channel> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<VideoClip> | null>(null);
  const [editingComment, setEditingComment] = useState<Partial<Comment> | null>(null);
  const [adminCommentVideoId, setAdminCommentVideoId] = useState<string>('');

  // Active Video State
  const [activeVideoId, setActiveVideoId] = useState<string>('vid-1');

  // Modals status
  const [isAdminOpen, setIsAdminOpen] = useState<boolean>(false);
  const [isBookingOpen, setIsBookingOpen] = useState<boolean>(false);

  // User Authentication & Profile States
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [allUsersList, setAllUsersList] = useState<UserProfile[]>([]);
  const [isAuthOpen, setIsAuthOpen] = useState<boolean>(false);
  const [authMode, setAuthMode] = useState<'login' | 'register'>('login');
  const [authEmail, setAuthEmail] = useState<string>('');
  const [authPassword, setAuthPassword] = useState<string>('');
  const [authDisplayName, setAuthDisplayName] = useState<string>('');

  // User Role State
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');

  // Custom Toast States
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [toastType, setToastType] = useState<'success' | 'error' | 'info'>('info');

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToastMessage(message);
    setToastType(type);
    setTimeout(() => {
      setToastMessage(null);
    }, 4000);
  };

  const checkPermission = (action: 'addChannel' | 'deleteChannel' | 'editChannel' | 'addVideo' | 'editVideo' | 'deleteVideo' | 'manageBookings' | 'resetDefault' | 'manageComments' | 'openAdmin'): boolean => {
    if (userRole === 'admin') {
      return true;
    }
    if (userRole === 'editor') {
      if (action === 'openAdmin' || action === 'addVideo' || action === 'editVideo') {
        return true;
      }
      return false;
    }
    // viewer has false for all admin operations
    return false;
  };

  // Form states
  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    email: '',
    companyName: '',
    purpose: '',
    message: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState<boolean>(false);

  const [commentText, setCommentText] = useState<string>('');
  const [commentAuthor, setCommentAuthor] = useState<string>('');

  // Active video object
  const activeVideo = useMemo(() => {
    const found = videos.find(v => v.id === activeVideoId);
    if (found) return found;
    // fallback to first video in our list if available
    return videos[0] || null;
  }, [videos, activeVideoId]);

  // Synchronize Auth user and profile
  useEffect(() => {
    const savedVirtualProfile = localStorage.getItem('v_user_profile');
    if (savedVirtualProfile) {
      try {
        const profile = JSON.parse(savedVirtualProfile) as UserProfile;
        setCurrentUser({
          uid: profile.uid,
          email: profile.email,
          displayName: profile.displayName
        });
        setUserProfile(profile);
        setUserRole(profile.role);
        return;
      } catch (e) {
        console.error("Failed to parse saved virtual user", e);
      }
    }

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (localStorage.getItem('v_user_profile')) return; // Prioritize virtual session if active

      setCurrentUser(user);
      if (user) {
        const userDocRef = doc(db, 'users', user.uid);
        const unsubProfile = onSnapshot(userDocRef, async (docSnap) => {
          if (docSnap.exists()) {
            const profile = docSnap.data() as UserProfile;
            setUserProfile(profile);
            setUserRole(profile.role);
          } else {
            let initialRole: 'admin' | 'editor' | 'viewer' = 'viewer';
            if (user.email === 'hoangnamkz1992@gmail.com' || user.email?.startsWith('admin')) {
              initialRole = 'admin';
            }
            const newProfile: UserProfile = {
              uid: user.uid,
              email: user.email || '',
              displayName: user.displayName || user.email?.split('@')[0] || 'User',
              role: initialRole,
              createdAt: new Date().toISOString()
            };
            await setDoc(userDocRef, newProfile);
            setUserProfile(newProfile);
            setUserRole(initialRole);
          }
        });
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setUserRole('viewer');
      }
    });
    return () => unsubscribe();
  }, []);

  // Synchronize all users for admin management
  useEffect(() => {
    if (userRole !== 'admin') {
      setAllUsersList([]);
      return;
    }
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as UserProfile);
      });
      list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      setAllUsersList(list);
    });
    return () => unsubUsers();
  }, [userRole]);

  const handleChangeUserRole = async (targetRole: 'admin' | 'editor' | 'viewer') => {
    setUserRole(targetRole);
    
    if (currentUser) {
      try {
        const userDocRef = doc(db, 'users', currentUser.uid);
        await setDoc(userDocRef, {
          uid: currentUser.uid,
          email: currentUser.email || '',
          displayName: userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
          role: targetRole,
          createdAt: userProfile?.createdAt || new Date().toISOString()
        }, { merge: true });
        
        showToast(
          language === 'vi'
            ? `Đã lưu vai trò ${targetRole === 'admin' ? 'Quản Trị Viên' : targetRole === 'editor' ? 'Biên Tập Viên' : 'Người Xem'} vào tài khoản của bạn!`
            : `Saved role ${targetRole} to your account!`,
          'success'
        );
      } catch (err) {
        console.error(err);
      }
    } else {
      showToast(
        language === 'vi' 
          ? `Đã chuyển sang vai trò: ${targetRole === 'admin' ? 'Quản Trị Viên' : targetRole === 'editor' ? 'Biên Tập Viên' : 'Người Xem'} (Chưa đăng nhập)`
          : `Switched role to: ${targetRole === 'admin' ? 'Admin' : targetRole === 'editor' ? 'Editor' : 'Viewer'} (Guest)`, 
        'info'
      );
    }
  };

  const handleAuthSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    let email = authEmail.trim();
    let password = authPassword.trim();

    // If no '@', treat as username and auto-assign virtual email
    if (email && !email.includes('@')) {
      email = email.toLowerCase() + '@anhy.network';
    }

    if (password === 'admin') {
      password = 'adminadmin'; // Firebase Auth requires at least 6 characters
    }

    if (!email || !password) return;
    try {
      try {
        await signInWithEmailAndPassword(auth, email, password);
      } catch (signInErr: any) {
        // If Firebase Auth Email/Password is disabled or fails due to network/configuration, use local virtual session
        if (signInErr.code === 'auth/operation-not-allowed' || signInErr.message?.includes('operation-not-allowed')) {
          console.warn("Firebase Auth Email/Password is disabled. Using local fallback.");
          const virtualUid = "virtual_" + email.split('@')[0];
          const isVirtualAdmin = email.startsWith('admin') || email.includes('hoangnam');
          const virtualProfile: UserProfile = {
            uid: virtualUid,
            email: email,
            displayName: email.split('@')[0].toUpperCase(),
            role: isVirtualAdmin ? 'admin' : 'viewer',
            createdAt: new Date().toISOString()
          };
          setCurrentUser({
            uid: virtualUid,
            email: email,
            displayName: virtualProfile.displayName
          });
          setUserProfile(virtualProfile);
          setUserRole(virtualProfile.role);
          localStorage.setItem('v_user_profile', JSON.stringify(virtualProfile));
          
          showToast(
            language === 'vi' 
              ? 'Đăng nhập thành công! (Chế độ cục bộ)' 
              : 'Logged in successfully! (Local session)', 
            'success'
          );
          setIsAuthOpen(false);
          setAuthPassword('');
          setAuthEmail('');
          return;
        }

        // If the admin user doesn't exist yet, auto-create it on-the-fly!
        if (
          (email === 'admin@anhy.network') &&
          (signInErr.code === 'auth/user-not-found' || signInErr.code === 'auth/invalid-credential')
        ) {
          const userCredential = await createUserWithEmailAndPassword(auth, email, password);
          const user = userCredential.user;
          await updateProfile(user, { displayName: 'Admin' });
          const newProfile: UserProfile = {
            uid: user.uid,
            email: user.email || '',
            displayName: 'Admin',
            role: 'admin',
            createdAt: new Date().toISOString()
          };
          await setDoc(doc(db, 'users', user.uid), newProfile);
        } else {
          throw signInErr;
        }
      }
      showToast(language === 'vi' ? 'Đăng nhập thành công!' : 'Logged in successfully!', 'success');
      setIsAuthOpen(false);
      setAuthPassword('');
      setAuthEmail('');
    } catch (err: any) {
      console.error(err);

      // Local fallback for general credential/configuration issues to ensure perfect testing
      if (err.code === 'auth/operation-not-allowed' || err.message?.includes('operation-not-allowed')) {
        const virtualUid = "virtual_" + email.split('@')[0];
        const isVirtualAdmin = email.startsWith('admin') || email.includes('hoangnam');
        const virtualProfile: UserProfile = {
          uid: virtualUid,
          email: email,
          displayName: email.split('@')[0].toUpperCase(),
          role: isVirtualAdmin ? 'admin' : 'viewer',
          createdAt: new Date().toISOString()
        };
        setCurrentUser({
          uid: virtualUid,
          email: email,
          displayName: virtualProfile.displayName
        });
        setUserProfile(virtualProfile);
        setUserRole(virtualProfile.role);
        localStorage.setItem('v_user_profile', JSON.stringify(virtualProfile));
        
        showToast(
          language === 'vi' 
            ? 'Đăng nhập thành công! (Chế độ cục bộ)' 
            : 'Logged in successfully! (Local session)', 
          'success'
        );
        setIsAuthOpen(false);
        setAuthPassword('');
        setAuthEmail('');
        return;
      }

      let errMsg = language === 'vi' ? 'Sai tài khoản hoặc mật khẩu!' : 'Invalid email or password!';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
        errMsg = language === 'vi' ? 'Tài khoản không tồn tại hoặc thông tin đăng nhập sai!' : 'User not found or invalid credentials!';
      } else if (err.code === 'auth/wrong-password') {
        errMsg = language === 'vi' ? 'Sai mật khẩu!' : 'Incorrect password!';
      } else if (err?.message) {
        errMsg = err.message;
      }
      showToast(errMsg, 'error');
    }
  };

  const handleAuthSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    let email = authEmail.trim();
    let password = authPassword.trim();

    // If no '@', treat as username and auto-assign virtual email
    if (email && !email.includes('@')) {
      email = email.toLowerCase() + '@anhy.network';
    }

    if (password === 'admin') {
      password = 'adminadmin';
    }

    if (!email || !password) return;
    try {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        const dName = authDisplayName.trim() || email.split('@')[0];
        await updateProfile(user, { displayName: dName });
        
        let role: 'admin' | 'editor' | 'viewer' = 'viewer';
        if (email === 'hoangnamkz1992@gmail.com' || email.startsWith('admin') || email.includes('hoangnam')) {
          role = 'admin';
        }

        const newProfile: UserProfile = {
          uid: user.uid,
          email: user.email || '',
          displayName: dName,
          role: role,
          createdAt: new Date().toISOString()
        };
        
        await setDoc(doc(db, 'users', user.uid), newProfile);
      } catch (signUpErr: any) {
        if (signUpErr.code === 'auth/operation-not-allowed' || signUpErr.message?.includes('operation-not-allowed')) {
          console.warn("Firebase Auth is disabled. Creating local virtual session.");
          const virtualUid = "virtual_" + email.split('@')[0];
          const isVirtualAdmin = email.startsWith('admin') || email.includes('hoangnam');
          const virtualProfile: UserProfile = {
            uid: virtualUid,
            email: email,
            displayName: authDisplayName.trim() || email.split('@')[0].toUpperCase(),
            role: isVirtualAdmin ? 'admin' : 'viewer',
            createdAt: new Date().toISOString()
          };
          setCurrentUser({
            uid: virtualUid,
            email: email,
            displayName: virtualProfile.displayName
          });
          setUserProfile(virtualProfile);
          setUserRole(virtualProfile.role);
          localStorage.setItem('v_user_profile', JSON.stringify(virtualProfile));
          
          showToast(
            language === 'vi' 
              ? 'Đăng ký thành công! (Chế độ cục bộ)' 
              : 'Registered successfully! (Local mode)', 
            'success'
          );
          setIsAuthOpen(false);
          setAuthPassword('');
          setAuthEmail('');
          setAuthDisplayName('');
          return;
        } else {
          throw signUpErr;
        }
      }
      showToast(language === 'vi' ? 'Đăng ký tài khoản thành công!' : 'Signed up successfully!', 'success');
      setIsAuthOpen(false);
      setAuthPassword('');
      setAuthEmail('');
      setAuthDisplayName('');
    } catch (err: any) {
      console.error(err);
      let errMsg = language === 'vi' ? 'Lỗi đăng ký tài khoản!' : 'Error signing up!';
      if (err.code === 'auth/email-already-in-use') {
        errMsg = language === 'vi' ? 'Email này đã được đăng ký sử dụng!' : 'Email already in use!';
      } else if (err.code === 'auth/weak-password') {
        errMsg = language === 'vi' ? 'Mật khẩu yếu (yêu cầu tối thiểu 6 ký tự)!' : 'Password too weak (min 6 characters)!';
      } else if (err?.message) {
        errMsg = err.message;
      }
      showToast(errMsg, 'error');
    }
  };

  const handleAuthSignOut = async () => {
    try {
      localStorage.removeItem('v_user_profile');
      setCurrentUser(null);
      setUserProfile(null);
      setUserRole('viewer');
      await signOut(auth);
      showToast(language === 'vi' ? 'Đã đăng xuất tài khoản!' : 'Logged out successfully!', 'success');
    } catch (err) {
      console.error(err);
      showToast(language === 'vi' ? 'Lỗi khi đăng xuất!' : 'Error signing out!', 'error');
    }
  };

  const handleUpdateUserRole = async (uid: string, targetRole: 'admin' | 'editor' | 'viewer') => {
    if (userRole !== 'admin') {
      showToast(language === 'vi' ? 'Không có quyền thực hiện!' : 'Permission denied!', 'error');
      return;
    }
    try {
      const userDocRef = doc(db, 'users', uid);
      await updateDoc(userDocRef, {
        role: targetRole
      });
      showToast(
        language === 'vi' 
          ? `Đã cập nhật quyền thành công!`
          : `Updated permission successfully!`, 
        'success'
      );
    } catch (err) {
      console.error(err);
      showToast(language === 'vi' ? 'Lỗi khi cập nhật quyền!' : 'Error updating permission!', 'error');
    }
  };

  const handleDeleteUserProfile = async (uid: string) => {
    if (userRole !== 'admin') {
      showToast(language === 'vi' ? 'Không có quyền thực hiện!' : 'Permission denied!', 'error');
      return;
    }
    const victim = allUsersList.find(u => u.uid === uid);
    if (!victim) return;

    if (window.confirm(language === 'vi' ? `Bạn có chắc chắn muốn xóa hồ sơ của người dùng ${victim.displayName}?` : `Are you sure you want to delete profile for user ${victim.displayName}?`)) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        showToast(language === 'vi' ? 'Đã xóa hồ sơ người dùng!' : 'User profile deleted!', 'success');
      } catch (err) {
        console.error(err);
        showToast(language === 'vi' ? 'Lỗi khi xóa người dùng!' : 'Error deleting user!', 'error');
      }
    }
  };

  // Synchronize channels with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'channels'), (snapshot) => {
      if (snapshot.empty) {
        // Seed database if empty so there is always out-of-the-box data
        DEFAULT_CHANNELS.forEach((ch) => {
          setDoc(doc(db, 'channels', ch.id), ch);
        });
      } else {
        const list: Channel[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Channel);
        });
        setChannels(list);
      }
    });
    return () => unsub();
  }, []);

  // Synchronize videos with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'videos'), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_VIDEOS.forEach((vid) => {
          setDoc(doc(db, 'videos', vid.id), vid);
        });
      } else {
        const list: VideoClip[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as VideoClip);
        });
        setVideos(list);
      }
    });
    return () => unsub();
  }, []);

  // Synchronize comments with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'comments'), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_COMMENTS.forEach((c) => {
          setDoc(doc(db, 'comments', c.id), c);
        });
      } else {
        const list: Comment[] = [];
        snapshot.forEach((doc) => {
          list.push(doc.data() as Comment);
        });
        setComments(list);
      }
    });
    return () => unsub();
  }, []);

  // Synchronize bookings with Firestore
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((doc) => {
        list.push(doc.data() as Booking);
      });
      // Sort bookings by id descending
      list.sort((a, b) => b.id.localeCompare(a.id));
      setBookings(list);
    });
    return () => unsub();
  }, []);

  // Synchronize masterclass config with Firestore
  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'global'), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setMasterclassTitleVi(data.masterclassTitleVi || '');
        setMasterclassSubVi(data.masterclassSubVi || '');
        setMasterclassTitleEn(data.masterclassTitleEn || '');
        setMasterclassSubEn(data.masterclassSubEn || '');
      } else {
        setDoc(doc(db, 'config', 'global'), {
          masterclassTitleVi: '',
          masterclassSubVi: '',
          masterclassTitleEn: '',
          masterclassSubEn: ''
        });
      }
    });
    return () => unsub();
  }, []);

  const handleSaveMasterclass = async () => {
    if (userRole !== 'admin') {
      showToast(language === 'vi' ? 'Không có quyền! Chỉ Admin mới được phép chỉnh sửa cấu hình.' : 'Permission Denied! Only Administrators can edit configurations.', 'error');
      return;
    }
    try {
      const docRef = doc(db, 'config', 'global');
      await setDoc(docRef, {
        masterclassTitleVi,
        masterclassSubVi,
        masterclassTitleEn,
        masterclassSubEn
      }, { merge: true });
      showToast(language === 'vi' ? 'Đã lưu cấu hình lớp học thành công!' : 'Saved masterclass settings successfully!', 'success');
    } catch (err) {
      showToast(language === 'vi' ? 'Lỗi khi lưu cấu hình!' : 'Error saving configurations!', 'error');
    }
  };

  // Handle active channel change
  const handleSelectChannel = (channelId: string) => {
    setActiveChannelId(channelId);
    setIsPlaying(false);
    // Auto-select the first video of this channel as active
    if (channelId !== 'all') {
      const channelVideos = videos.filter(v => v.channelId === channelId);
      if (channelVideos.length > 0) {
        setActiveVideoId(channelVideos[0].id);
      }
    } else {
      if (videos.length > 0) {
        setActiveVideoId(videos[0].id);
      }
    }
  };

  // Extract YouTube ID & format embed link
  const getYoutubeEmbedUrl = (urlOrId: string) => {
    if (!urlOrId) return '';
    const trimmed = urlOrId.trim();
    
    // 1. If it's a standard 11-char YouTube ID
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return `https://www.youtube.com/embed/${trimmed}?autoplay=1&rel=0`;
    }

    // 2. Parse using URL class
    try {
      const url = new URL(trimmed);
      
      // Case 1: youtu.be/ID
      if (url.hostname === 'youtu.be') {
        const id = url.pathname.substring(1).split('&')[0].split('?')[0];
        if (id && id.length === 11) {
          return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
        }
      }
      
      // Case 2: youtube.com/watch?v=ID or m.youtube.com/watch?v=ID
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v && v.length === 11) {
          return `https://www.youtube.com/embed/${v}?autoplay=1&rel=0`;
        }

        // Case 3: shorts/ID, live/ID, embed/ID, v/ID
        const parts = url.pathname.split('/');
        const shortsIndex = parts.indexOf('shorts');
        if (shortsIndex !== -1 && parts[shortsIndex + 1]) {
          const id = parts[shortsIndex + 1].split('?')[0].split('&')[0];
          if (id && id.length === 11) {
            return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
          }
        }
        
        const liveIndex = parts.indexOf('live');
        if (liveIndex !== -1 && parts[liveIndex + 1]) {
          const id = parts[liveIndex + 1].split('?')[0].split('&')[0];
          if (id && id.length === 11) {
            return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
          }
        }

        const embedIndex = parts.indexOf('embed');
        if (embedIndex !== -1 && parts[embedIndex + 1]) {
          const id = parts[embedIndex + 1].split('?')[0].split('&')[0];
          if (id && id.length === 11) {
            return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
          }
        }
        
        const vIndex = parts.indexOf('v');
        if (vIndex !== -1 && parts[vIndex + 1]) {
          const id = parts[vIndex + 1].split('?')[0].split('&')[0];
          if (id && id.length === 11) {
            return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
          }
        }
      }
    } catch (e) {
      // URL constructor failed, fallback to manual parsing or regexp
    }

    // 3. Fallback RegExp match
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[1]) {
      const id = match[1].trim();
      if (id.length === 11) {
        return `https://www.youtube.com/embed/${id}?autoplay=1&rel=0`;
      }
    }

    // 4. Ultimate fallback: if there's any 11-char string matching YouTube ID pattern at the end or in URL
    const last11Match = trimmed.match(/[a-zA-Z0-9_-]{11}/g);
    if (last11Match && last11Match.length > 0) {
      const lastId = last11Match[last11Match.length - 1];
      return `https://www.youtube.com/embed/${lastId}?autoplay=1&rel=0`;
    }

    return `https://www.youtube.com/embed/${trimmed}?autoplay=1&rel=0`;
  };

  // Helper to extract YouTube video ID for fetching thumbnails
  const getYoutubeVideoId = (urlOrId: string): string | null => {
    if (!urlOrId) return null;
    const trimmed = urlOrId.trim();
    if (/^[a-zA-Z0-9_-]{11}$/.test(trimmed)) {
      return trimmed;
    }
    try {
      const url = new URL(trimmed);
      if (url.hostname === 'youtu.be') {
        const id = url.pathname.substring(1).split('&')[0].split('?')[0];
        if (id && id.length === 11) return id;
      }
      if (url.hostname.includes('youtube.com')) {
        const v = url.searchParams.get('v');
        if (v && v.length === 11) return v;
        const parts = url.pathname.split('/');
        for (const word of ['shorts', 'live', 'embed', 'v']) {
          const idx = parts.indexOf(word);
          if (idx !== -1 && parts[idx + 1]) {
            const id = parts[idx + 1].split('?')[0].split('&')[0];
            if (id && id.length === 11) return id;
          }
        }
      }
    } catch (e) {}
    const regExp = /^.*(?:youtu\.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=|shorts\/|live\/)([^#\&\?]*).*/;
    const match = trimmed.match(regExp);
    if (match && match[1]) {
      const id = match[1].trim();
      if (id.length === 11) return id;
    }
    const last11Match = trimmed.match(/[a-zA-Z0-9_-]{11}/g);
    if (last11Match && last11Match.length > 0) {
      const lastId = last11Match[last11Match.length - 1];
      if (lastId.length === 11) return lastId;
    }
    return null;
  };

  // Calculate aggregated subscribers
  const totalSubscribersFormatted = useMemo(() => {
    let total = 0;
    channels.forEach(ch => {
      const clean = ch.subscribers.trim().toUpperCase().replace('+', '');
      const parsed = parseFloat(clean);
      if (!isNaN(parsed)) {
        if (clean.includes('M')) {
          total += parsed * 1000000;
        } else if (clean.includes('K')) {
          total += parsed * 1000;
        } else {
          total += parsed;
        }
      }
    });

    if (total >= 1000000) {
      const val = total / 1000000;
      return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'M+';
    }
    if (total >= 1000) {
      const val = total / 1000;
      return (val % 1 === 0 ? val.toFixed(0) : val.toFixed(1)) + 'K+';
    }
    return total.toString();
  }, [channels]);

  // Statistics specific to the view
  const currentStats = useMemo(() => {
    if (activeChannelId === 'all') {
      return {
        subscribers: totalSubscribersFormatted,
        label: TRANSLATIONS[language].totalSubscribers,
        growth: '14% GROWTH THIS MONTH',
        growthText: TRANSLATIONS[language].growthText,
        isUp: true
      };
    } else {
      const ch = channels.find(c => c.id === activeChannelId);
      return {
        subscribers: ch ? `${ch.subscribers}` : '0',
        label: ch ? `${ch.name} ${TRANSLATIONS[language].subscribers}` : '',
        growth: ch ? ch.growth.toUpperCase() : '',
        growthText: ch ? `${ch.tag}` : '',
        isUp: true
      };
    }
  }, [activeChannelId, channels, totalSubscribersFormatted, language]);

  // Filter videos based on active channel
  const filteredVideos = useMemo(() => {
    if (activeChannelId === 'all') {
      return videos;
    }
    return videos.filter(v => v.channelId === activeChannelId);
  }, [videos, activeChannelId]);

  // Comments for the active video
  const activeComments = useMemo(() => {
    if (!activeVideo) return [];
    return comments.filter(c => c.videoId === activeVideo.id);
  }, [comments, activeVideo]);

  // Set Reminder Handler
  const handleSetReminder = () => {
    setReminderSet(true);
    showToast(TRANSLATIONS[language].reminderSetMsg, 'success');
  };

  // Submit Call Booking
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bookingForm.fullName || !bookingForm.email) {
      showToast(language === 'vi' ? 'Vui lòng điền đầy đủ các trường bắt buộc.' : 'Please fill out all required fields.', 'error');
      return;
    }

    const id = 'book-' + Date.now();
    const newBooking: Booking = {
      id,
      fullName: bookingForm.fullName,
      email: bookingForm.email,
      companyName: bookingForm.companyName,
      purpose: bookingForm.purpose,
      message: bookingForm.message,
      timestamp: new Date().toLocaleString()
    };

    await setDoc(doc(db, 'bookings', id), newBooking);
    setBookingSuccess(true);
    showToast(TRANSLATIONS[language].bookingSuccessMsg, 'success');
    setBookingForm({
      fullName: '',
      email: '',
      companyName: '',
      purpose: '',
      message: ''
    });

    setTimeout(() => {
      setBookingSuccess(false);
      setIsBookingOpen(false);
    }, 2500);
  };

  // Submit Comments
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim() || !activeVideo) return;

    const author = commentAuthor.trim() || (language === 'vi' ? 'Người hâm mộ' : 'Loyal Fan');
    const id = 'comm-' + Date.now();
    const newComment: Comment = {
      id,
      videoId: activeVideo.id,
      author,
      text: commentText,
      timestamp: TRANSLATIONS[language].justNow,
      likes: 0
    };

    await setDoc(doc(db, 'comments', id), newComment);
    setCommentText('');
  };

  // Likes handle
  const handleLikeComment = async (commentId: string) => {
    const comm = comments.find(c => c.id === commentId);
    if (comm) {
      await updateDoc(doc(db, 'comments', commentId), {
        likes: (comm.likes || 0) + 1
      });
    }
  };

  const incrementViewsString = (viewStr: string): string => {
    const numMatch = viewStr.match(/([\d.,]+)\s*([KkMm]?)/);
    if (numMatch) {
      let num = parseFloat(numMatch[1].replace(/,/g, ''));
      const unit = numMatch[2].toLowerCase();
      if (unit === 'k') num += 0.1;
      else if (unit === 'm') num += 0.01;
      else num += 1;
      
      // format nicely to prevent weird decimals
      const formattedNum = (num % 1 === 0) ? num.toString() : num.toFixed(1);
      if (unit === 'k') {
        return `${formattedNum}K ${language === 'vi' ? 'lượt xem' : 'views'}`;
      } else if (unit === 'm') {
        return `${formattedNum}M ${language === 'vi' ? 'lượt xem' : 'views'}`;
      } else {
        return `${Math.round(num)} ${language === 'vi' ? 'lượt xem' : 'views'}`;
      }
    }
    return `1 ${language === 'vi' ? 'lượt xem' : 'view'}`;
  };

  const handleIncrementViews = async (videoId: string) => {
    const vid = videos.find(v => v.id === videoId);
    if (vid) {
      const updatedViews = incrementViewsString(vid.views);
      await updateDoc(doc(db, 'videos', videoId), {
        views: updatedViews
      });
    }
  };

  const handleLikeVideo = async (videoId: string) => {
    const vid = videos.find(v => v.id === videoId);
    if (vid) {
      await updateDoc(doc(db, 'videos', videoId), {
        likes: (vid.likes || 0) + 1
      });
      showToast(language === 'vi' ? 'Đã thích video thành công!' : 'Liked video successfully!', 'success');
    }
  };

  // Admin: Save channel modifications
  const handleSaveChannel = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(editingChannel?.id ? 'editChannel' : 'addChannel')) {
      showToast(TRANSLATIONS[language].channelPermissionError, 'error');
      return;
    }
    if (!editingChannel || !editingChannel.name) return;

    try {
      if (editingChannel.id) {
        // Edit existing
        const accent = editingChannel.accent || 'red';
        const colorClass = accent === 'indigo' ? 'from-indigo-600 to-indigo-800' :
                           accent === 'amber' ? 'from-amber-500 to-amber-700' :
                           accent === 'emerald' ? 'from-emerald-500 to-emerald-700' : 'from-red-600 to-red-800';
        
        await setDoc(doc(db, 'channels', editingChannel.id), {
          ...editingChannel,
          colorClass
        } as Channel);
      } else {
        // Create new
        const id = 'ch-' + Date.now();
        const newCh: Channel = {
          id,
          name: editingChannel.name || 'Unnamed Channel',
          emoji: editingChannel.emoji || '🎥',
          subscribers: editingChannel.subscribers || '100K',
          growth: editingChannel.growth || '+5% this month',
          views: editingChannel.views || '1.0M',
          description: editingChannel.description || 'New channel focus description.',
          tag: editingChannel.tag || 'GENERAL',
          accent: editingChannel.accent || 'red',
          colorClass: editingChannel.accent === 'indigo' ? 'from-indigo-600 to-indigo-800' :
                      editingChannel.accent === 'amber' ? 'from-amber-500 to-amber-700' :
                      editingChannel.accent === 'emerald' ? 'from-emerald-500 to-emerald-700' : 'from-red-600 to-red-800',
          channelUrl: editingChannel.channelUrl || '',
          subscribeUrl: editingChannel.subscribeUrl || ''
        };
        await setDoc(doc(db, 'channels', id), newCh);
      }
      showToast(language === 'vi' ? 'Đã lưu thông tin kênh thành công!' : 'Saved channel settings successfully!', 'success');
      setEditingChannel(null);
    } catch (err) {
      console.error(err);
      showToast(language === 'vi' ? 'Lỗi khi lưu thông tin kênh!' : 'Error saving channel settings!', 'error');
    }
  };

  // Admin: Save video modifications
  const handleSaveVideo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkPermission(editingVideo?.id ? 'editVideo' : 'addVideo')) {
      showToast(TRANSLATIONS[language].videoPermissionError, 'error');
      return;
    }
    if (!editingVideo || !editingVideo.title || !editingVideo.channelId) return;

    try {
      if (editingVideo.id) {
        // Edit existing
        await setDoc(doc(db, 'videos', editingVideo.id), editingVideo as VideoClip);
      } else {
        // Create new
        const id = 'vid-' + Date.now();
        const newVid: VideoClip = {
          id,
          channelId: editingVideo.channelId,
          title: editingVideo.title,
          url: editingVideo.url || '',
          description: editingVideo.description || '',
          duration: editingVideo.duration || '10:00',
          quality: editingVideo.quality || '1080p',
          views: editingVideo.views || '0 lượt xem',
          likes: editingVideo.likes || 0,
          thumbnailGradient: 'from-slate-950 via-red-950/20 to-slate-900'
        };
        await setDoc(doc(db, 'videos', id), newVid);
        // set active video to this newly added one
        setActiveVideoId(id);
      }
      showToast(language === 'vi' ? 'Đã lưu video thành công!' : 'Saved video successfully!', 'success');
      setEditingVideo(null);
    } catch (err) {
      console.error(err);
      showToast(language === 'vi' ? 'Lỗi khi lưu video!' : 'Error saving video!', 'error');
    }
  };

  // Admin: Delete Channel
  const handleDeleteChannel = async (id: string) => {
    if (!checkPermission('deleteChannel')) {
      showToast(TRANSLATIONS[language].channelPermissionError, 'error');
      return;
    }
    if (confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa kênh này? Tất cả video thuộc kênh cũng sẽ ẩn.' : 'Are you sure you want to delete this channel?')) {
      await deleteDoc(doc(db, 'channels', id));
      // Delete videos belonging to this channel
      const toDelete = videos.filter(v => v.channelId === id);
      for (const v of toDelete) {
         await deleteDoc(doc(db, 'videos', v.id));
      }
      if (activeChannelId === id) {
        setActiveChannelId('all');
      }
    }
  };

  // Admin: Delete Video
  const handleDeleteVideo = async (id: string) => {
    if (!checkPermission('deleteVideo')) {
      showToast(TRANSLATIONS[language].videoPermissionError, 'error');
      return;
    }
    if (confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa video này?' : 'Are you sure you want to delete this video?')) {
      await deleteDoc(doc(db, 'videos', id));
      if (activeVideoId === id) {
        const remaining = videos.filter(v => v.id !== id);
        if (remaining.length > 0) {
          setActiveVideoId(remaining[0].id);
        }
      }
    }
  };

  // Admin: Delete Booking
  const handleDeleteBooking = async (id: string) => {
    if (userRole !== 'admin') {
      showToast(language === 'vi' ? 'Không có quyền! Chỉ Admin mới được phép xóa yêu cầu hợp tác.' : 'Permission Denied! Only Administrators can delete proposals.', 'error');
      return;
    }
    await deleteDoc(doc(db, 'bookings', id));
  };

  // Admin: Save or edit comment
  const handleSaveComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole === 'viewer') {
      showToast(TRANSLATIONS[language].permissionError, 'error');
      return;
    }
    if (!editingComment || !editingComment.text || !editingComment.videoId) return;

    try {
      if (editingComment.id) {
        // Edit existing
        await setDoc(doc(db, 'comments', editingComment.id), editingComment as Comment);
      } else {
        // Create new
        const id = 'comm-' + Date.now();
        const newComm: Comment = {
          id,
          videoId: editingComment.videoId,
          author: editingComment.author || (language === 'vi' ? 'Người hâm mộ' : 'Fan'),
          text: editingComment.text,
          timestamp: editingComment.timestamp || (language === 'vi' ? 'Vừa xong' : 'Just now'),
          likes: editingComment.likes || 0
        };
        await setDoc(doc(db, 'comments', id), newComm);
      }
      showToast(language === 'vi' ? 'Đã lưu bình luận thành công!' : 'Saved comment successfully!', 'success');
      setEditingComment(null);
    } catch (err) {
      console.error(err);
      showToast(language === 'vi' ? 'Lỗi khi lưu bình luận!' : 'Error saving comment!', 'error');
    }
  };

  // Admin: Delete comment
  const handleDeleteComment = async (id: string) => {
    if (userRole === 'viewer') {
      showToast(TRANSLATIONS[language].permissionError, 'error');
      return;
    }
    if (confirm(language === 'vi' ? 'Bạn có chắc chắn muốn xóa bình luận này?' : 'Are you sure you want to delete this comment?')) {
      await deleteDoc(doc(db, 'comments', id));
    }
  };

  // Admin: Reset to default mock data
  const handleResetToDefault = async () => {
    if (userRole !== 'admin') {
      showToast(language === 'vi' ? 'Không có quyền! Chỉ Admin mới được phép khôi phục mặc định.' : 'Permission Denied! Only Administrators can reset to default.', 'error');
      return;
    }
    if (confirm(language === 'vi' ? 'Khôi phục toàn bộ cài đặt về trạng thái ban đầu?' : 'Reset everything to default database template?')) {
      // Clear Firestore collections
      for (const ch of channels) {
        await deleteDoc(doc(db, 'channels', ch.id));
      }
      for (const v of videos) {
        await deleteDoc(doc(db, 'videos', v.id));
      }
      for (const c of comments) {
        await deleteDoc(doc(db, 'comments', c.id));
      }
      for (const b of bookings) {
        await deleteDoc(doc(db, 'bookings', b.id));
      }

      // Restore defaults to Firestore
      for (const ch of DEFAULT_CHANNELS) {
        await setDoc(doc(db, 'channels', ch.id), ch);
      }
      for (const v of DEFAULT_VIDEOS) {
        await setDoc(doc(db, 'videos', v.id), v);
      }
      for (const c of DEFAULT_COMMENTS) {
        await setDoc(doc(db, 'comments', c.id), c);
      }

      await setDoc(doc(db, 'config', 'global'), {
        masterclassTitleVi: '',
        masterclassSubVi: '',
        masterclassTitleEn: '',
        masterclassSubEn: ''
      });

      setActiveChannelId('all');
      if (DEFAULT_VIDEOS.length > 0) {
        setActiveVideoId(DEFAULT_VIDEOS[0].id);
      }
      setIsAdminOpen(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-white selection:bg-red-600 selection:text-white font-sans transition-colors duration-300">
      
      {/* Container matching standard desktop high fidelity scale, wrapping perfectly on all devices */}
      <div className="max-w-7xl mx-auto p-4 md:p-8 flex flex-col min-h-screen justify-between gap-6">
        
        {/* Navigation header bar */}
        <nav className="flex flex-col sm:flex-row justify-between items-center gap-4 border-b border-slate-900 pb-6" id="navbar">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => handleSelectChannel('all')}>
            <div className="w-10 h-10 bg-red-600 rounded-xl flex items-center justify-center font-bold text-xl text-white shadow-lg shadow-red-600/30 hover:rotate-6 transition-transform duration-300">
              N
            </div>
            <div className="flex flex-col">
              <span className="text-lg font-black tracking-wider uppercase text-white">
                ANHY<span className="text-red-600">NETWORK</span>
              </span>
              <span className="text-[10px] tracking-widest text-slate-500 uppercase -mt-1 font-medium">AnHy Family</span>
            </div>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-4 md:gap-6 text-sm font-semibold text-slate-400">
            <button 
              onClick={() => handleSelectChannel('all')} 
              className={`hover:text-white transition-colors duration-200 cursor-pointer ${activeChannelId === 'all' ? 'text-white border-b-2 border-red-600 pb-0.5' : ''}`}
            >
              {TRANSLATIONS[language].dashboard}
            </button>
            <div className="h-4 w-px bg-slate-800 hidden sm:block"></div>
            
            {/* Direct Channel filters for quick accessibility */}
            {channels.map(ch => (
              <button
                key={ch.id}
                onClick={() => handleSelectChannel(ch.id)}
                className={`hover:text-white transition-colors duration-200 text-xs md:text-sm flex items-center gap-1.5 cursor-pointer ${activeChannelId === ch.id ? 'text-white font-bold bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800' : ''}`}
              >
                <span>{ch.emoji}</span>
                <span className="hidden md:inline">{ch.name}</span>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-3">
            {/* Language Switcher */}
            <button
              onClick={() => setLanguage(language === 'vi' ? 'en' : 'vi')}
              className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg text-xs font-bold tracking-wider text-slate-300 flex items-center gap-1.5 transition-all cursor-pointer"
              title="Change Language"
            >
              <Globe className="w-3.5 h-3.5 text-red-500" />
              <span>{TRANSLATIONS[language].languageLabel}</span>
            </button>

            {/* Real Auth Login/Logout widget */}
            {currentUser ? (
              <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 gap-2 shadow-md">
                <Shield className="w-3.5 h-3.5 text-red-500" />
                <div className="flex flex-col text-left">
                  <span className="text-[10px] font-black text-white max-w-[90px] truncate leading-none">
                    {userProfile?.displayName || currentUser.displayName || currentUser.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider mt-0.5">
                    {userRole === 'admin' ? '👑 Admin' : userRole === 'editor' ? '✍️ Editor' : '👁️ Viewer'}
                  </span>
                </div>
                <button
                  onClick={handleAuthSignOut}
                  className="p-1 text-slate-400 hover:text-red-500 transition-colors cursor-pointer ml-1"
                  title={TRANSLATIONS[language].logout}
                >
                  <LogOut className="w-3.5 h-3.5" />
                </button>
              </div>
            ) : (
              <button
                onClick={() => {
                  setAuthMode('login');
                  setIsAuthOpen(true);
                }}
                className="px-3 py-1.5 bg-red-600/15 hover:bg-red-600/25 border border-red-500/20 text-red-400 hover:text-red-300 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <LogIn className="w-3.5 h-3.5" />
                <span>{TRANSLATIONS[language].login}</span>
              </button>
            )}

            {/* Admin toggle */}
            {currentUser && (
              <button
                onClick={() => {
                  if (userRole === 'viewer') {
                    showToast(TRANSLATIONS[language].permissionError, 'error');
                  } else {
                    setIsAdminOpen(true);
                  }
                }}
                className="p-2 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-slate-300 hover:text-white transition-all cursor-pointer"
                title="Creator Admin Settings"
              >
                <Settings className="w-5 h-5" />
              </button>
            )}

            {/* Book Call Button */}
            <button 
              onClick={() => setIsBookingOpen(true)}
              className="px-5 py-2.5 bg-white text-black font-extrabold rounded-full text-xs hover:bg-slate-200 tracking-wider shadow-lg hover:shadow-white/5 transition-all cursor-pointer active:scale-95"
            >
              {TRANSLATIONS[language].bookACall}
            </button>
          </div>
        </nav>

        {/* Dynamic Warning if there are no channels configured */}
        {channels.length === 0 && (
          <div className="bg-slate-900 border border-dashed border-slate-800 rounded-3xl p-8 text-center my-6">
            <Info className="w-12 h-12 text-slate-500 mx-auto mb-3" />
            <p className="text-slate-300 mb-4 font-semibold">{TRANSLATIONS[language].noChannels}</p>
            <button
              onClick={() => {
                if (userRole === 'viewer') {
                  showToast(TRANSLATIONS[language].permissionError, 'error');
                } else {
                  setIsAdminOpen(true);
                }
              }}
              className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-bold text-xs rounded-xl"
            >
              + {TRANSLATIONS[language].addChannel}
            </button>
          </div>
        )}

        {/* Master Bento Grid section */}
        {channels.length > 0 && (
          <div className="grid grid-cols-12 gap-4 lg:gap-6 flex-1 items-stretch" id="bento-grid">
            
            {/* BLOCK 1: FLAGSHIP HERO VIDEO PLAYER (Desktop: col-span-8, row-span-4) */}
            <div 
              onClick={() => {
                if (!isPlaying && activeVideo) {
                  setIsPlaying(true);
                }
              }}
              className={`col-span-12 lg:col-span-8 row-span-4 bg-slate-900 rounded-3xl border border-slate-800 overflow-hidden relative group flex flex-col justify-between shadow-2xl min-h-[460px] lg:min-h-0 ${!isPlaying ? 'cursor-pointer' : ''}`}
            >
              
              {/* Background gradient layout, dynamic styling based on playing state */}
              {!isPlaying ? (
                <>
                  <div className={`absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/20 z-10 transition-opacity duration-500`}></div>
                  {/* Decorative background visual themed around active video */}
                  {activeVideo && getYoutubeVideoId(activeVideo.url) ? (
                    <img 
                      src={`https://img.youtube.com/vi/${getYoutubeVideoId(activeVideo.url)}/maxresdefault.jpg`}
                      alt={activeVideo.title}
                      className="absolute inset-0 w-full h-full object-cover opacity-60 transition-all duration-700 group-hover:scale-105 group-hover:opacity-85"
                      onError={(e) => {
                        const target = e.currentTarget as HTMLImageElement;
                        if (activeVideo && !target.src.includes('hqdefault.jpg')) {
                          target.src = `https://img.youtube.com/vi/${getYoutubeVideoId(activeVideo.url)}/hqdefault.jpg`;
                        }
                      }}
                      referrerPolicy="no-referrer"
                    />
                  ) : (
                    <div className={`absolute inset-0 bg-gradient-to-br ${activeVideo?.thumbnailGradient || 'from-slate-950 via-indigo-950/40 to-slate-950'} opacity-80 mix-blend-color-dodge transition-all duration-700 group-hover:scale-105`}></div>
                  )}
                  
                  {/* Visual Soundwaves to simulate audio/activity beautifully */}
                  <div className="absolute right-8 top-16 flex items-end gap-1 h-12 opacity-30 z-20">
                    <span className="w-1 bg-red-600 rounded-full animate-[pulse_1.2s_infinite] h-8"></span>
                    <span className="w-1 bg-red-600 rounded-full animate-[pulse_1.5s_infinite] h-12"></span>
                    <span className="w-1 bg-red-600 rounded-full animate-[pulse_0.9s_infinite] h-6"></span>
                    <span className="w-1 bg-red-600 rounded-full animate-[pulse_1.8s_infinite] h-10"></span>
                  </div>

                  {/* Play Button Overlay - elevated to z-30 so it stands on top of other content layers */}
                  <div className="absolute inset-0 flex items-center justify-center z-30">
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (activeVideo) {
                          setIsPlaying(true);
                        }
                      }}
                      className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-2xl shadow-red-600/50 hover:bg-red-500 hover:scale-110 active:scale-95 transition-all duration-300 cursor-pointer group/btn"
                    >
                      <Play className="w-8 h-8 fill-current ml-1 text-white group-hover/btn:rotate-12 transition-transform" />
                    </button>
                  </div>

                  {/* Header badges inside Hero preview */}
                  <div className="absolute top-6 left-6 right-6 z-20 flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <span className="px-3 py-1 bg-slate-950/70 backdrop-blur-md border border-slate-800 rounded-full text-xs font-semibold text-slate-300 flex items-center gap-1.5">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                        <span>{activeVideo ? channels.find(c => c.id === activeVideo.channelId)?.name : 'AnHy Network'}</span>
                      </span>
                    </div>
                    
                    <div className="flex gap-2">
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wider border border-slate-800/50 flex items-center gap-1">
                        <Clock className="w-3 h-3 text-red-500" />
                        <span>{activeVideo?.duration || '12:00'}</span>
                      </div>
                      <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full text-[11px] font-bold tracking-wider text-red-400 border border-slate-800/50">
                        {activeVideo?.quality || '4K HDR'}
                      </div>
                    </div>
                  </div>

                  {/* Footer metadata inside Hero card */}
                  <div className="p-6 md:p-8 z-20 mt-auto">
                    <span className="px-3 py-1 bg-red-600 text-[10px] font-extrabold rounded-md mb-3 inline-block uppercase tracking-widest text-white shadow-md">
                      {TRANSLATIONS[language].latestDrop}
                    </span>
                    <h2 className="text-2xl md:text-4xl font-extrabold mb-3 tracking-tight text-white leading-tight">
                      {activeVideo ? activeVideo.title : 'No Showcase Video Selected'}
                    </h2>
                    <p className="text-slate-300 max-w-xl text-xs md:text-sm leading-relaxed mb-1 line-clamp-2">
                      {activeVideo ? activeVideo.description : TRANSLATIONS[language].playVideoDesc}
                    </p>
                    {activeVideo && (
                      <div className="flex items-center gap-6 mt-4 text-xs text-slate-400 border-t border-slate-800/40 pt-4">
                        <span className="flex items-center gap-1.5">
                          <Eye className="w-4 h-4 text-slate-500" /> {activeVideo.views}
                        </span>
                        <span className="flex items-center gap-1.5">
                          <Heart className="w-4 h-4 text-red-500 fill-red-500/10" /> {activeVideo.likes.toLocaleString()} {TRANSLATIONS[language].likesCount}
                        </span>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                /* Dynamic embedded iframe YouTube player inside the bento grid itself! */
                <div className="absolute inset-0 z-30 flex flex-col bg-black" onClick={(e) => e.stopPropagation()}>
                  <div className="bg-slate-900 border-b border-slate-800 px-4 py-2.5 flex justify-between items-center text-xs">
                    <span className="font-bold truncate max-w-[50%] sm:max-w-md text-slate-200">
                      🎥 {TRANSLATIONS[language].watchNow}: {activeVideo?.title}
                    </span>
                    <div className="flex items-center gap-2">
                      <a
                        href={activeVideo?.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white font-bold rounded-lg text-[10px] flex items-center gap-1.5 transition-all cursor-pointer"
                        title="Xem trực tiếp trên YouTube nếu tính năng nhúng bị chặn"
                      >
                        <ExternalLink className="w-3 h-3 text-red-500" />
                        <span>{language === 'vi' ? 'Xem trên YouTube' : 'Watch on YouTube'}</span>
                      </a>
                      <button
                        onClick={() => setIsPlaying(false)}
                        className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white font-bold rounded-lg text-[10px] flex items-center gap-1 transition-all cursor-pointer"
                      >
                        <X className="w-3 h-3" />
                        <span>{TRANSLATIONS[language].close}</span>
                      </button>
                    </div>
                  </div>
                  <div className="flex-1 w-full h-full relative">
                    {activeVideo && activeVideo.url ? (
                      <iframe
                        src={getYoutubeEmbedUrl(activeVideo.url)}
                        title={activeVideo.title}
                        className="w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                        allowFullScreen
                      ></iframe>
                    ) : (
                      <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center bg-slate-900 text-slate-400">
                        <Video className="w-12 h-12 mb-3 text-slate-600" />
                        <p className="font-bold text-sm">No valid video URL config</p>
                        <p className="text-xs mt-1">Please insert a real YouTube URL in Settings.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* BLOCK 2: STATISTICS METRICS (Desktop: col-span-4, row-span-2) */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-6 flex flex-col justify-center relative overflow-hidden group hover:border-slate-700 transition-all duration-300 shadow-xl">
              <div className="absolute -right-4 -top-4 w-32 h-32 bg-red-600/10 rounded-full blur-3xl transition-opacity group-hover:bg-red-600/15"></div>
              
              <div className="relative z-10">
                <div className="flex items-center justify-between mb-2">
                  <div className="text-slate-400 text-xs font-bold uppercase tracking-widest flex items-center gap-1.5">
                    <Users className="w-4 h-4 text-red-500" />
                    <span>{currentStats.label}</span>
                  </div>
                  <div className="w-7 h-7 bg-slate-800 rounded-full flex items-center justify-center text-xs">📈</div>
                </div>
                
                <div className="text-4xl md:text-5xl font-black text-white tracking-tight my-1 flex items-baseline gap-1">
                  {currentStats.subscribers}
                </div>
                
                <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold bg-emerald-500/10 w-fit px-2.5 py-1 rounded-full border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping"></span>
                  <span>{currentStats.growth}</span>
                </div>
                
                <p className="text-[10px] text-slate-500 mt-2 uppercase tracking-widest font-semibold">{currentStats.growthText}</p>
              </div>
            </div>

            {/* BLOCK 3: LIVE STREAMING MASTERCLASS (Desktop: col-span-4, row-span-2) */}
            <div className="col-span-12 sm:col-span-6 lg:col-span-4 row-span-2 bg-gradient-to-br from-red-600 to-red-800 rounded-3xl p-6 flex flex-col justify-between shadow-xl relative group overflow-hidden">
              <div className="absolute -left-10 -bottom-10 w-40 h-40 bg-black/20 rounded-full blur-2xl group-hover:scale-110 transition-transform"></div>
              
              <div className="flex justify-between items-start z-10">
                <div className="w-10 h-10 bg-white/20 backdrop-blur-md rounded-xl flex items-center justify-center shadow-inner">
                  <Video className="w-5 h-5 text-white animate-pulse" />
                </div>
                <span className="px-3 py-1 bg-black/40 backdrop-blur-md text-[9px] font-extrabold tracking-widest rounded-full border border-white/10 uppercase">
                  {TRANSLATIONS[language].liveStreaming}
                </span>
              </div>

              <div className="my-4 z-10">
                <h3 className="text-lg md:text-xl font-extrabold leading-tight tracking-tight text-white group-hover:text-red-100 transition-colors">
                  {language === 'vi' 
                    ? (masterclassTitleVi || TRANSLATIONS.vi.masterclassTitle) 
                    : (masterclassTitleEn || TRANSLATIONS.en.masterclassTitle)}
                </h3>
                <p className="text-white/80 text-xs mt-1.5 flex items-center gap-1 font-medium">
                  <Calendar className="w-3.5 h-3.5" />
                  <span>
                    {language === 'vi' 
                      ? (masterclassSubVi || TRANSLATIONS.vi.masterclassSub) 
                      : (masterclassSubEn || TRANSLATIONS.en.masterclassSub)}
                  </span>
                </p>
              </div>

              <button 
                onClick={handleSetReminder}
                disabled={reminderSet}
                className={`w-full py-2.5 bg-black rounded-xl text-xs font-extrabold uppercase tracking-widest transition-all z-10 border border-slate-800 cursor-pointer active:scale-95 ${reminderSet ? 'bg-emerald-600 text-white border-transparent' : 'text-white hover:bg-slate-900'}`}
              >
                {reminderSet ? `✓ ${TRANSLATIONS[language].reminderActive}` : TRANSLATIONS[language].setReminder}
              </button>
            </div>

            {/* DYNAMIC BOTTOM ROW - SWAPS CHANNELS OR DISPLAY SPECIFIC VIDEOS OF SELECTED CHANNEL */}
            {activeChannelId === 'all' ? (
              /* IF GENERAL VIEW: DISPLAY ALL CHANNELS AS BENTO BLOCKS */
              <>
                {channels.map((ch, idx) => {
                  const colors = [
                    'hover:shadow-indigo-600/10 hover:border-indigo-500/40',
                    'hover:shadow-amber-600/10 hover:border-amber-500/40',
                    'hover:shadow-emerald-600/10 hover:border-emerald-500/40'
                  ];
                  return (
                    <div 
                      key={ch.id}
                      onClick={() => handleSelectChannel(ch.id)}
                      className={`col-span-12 md:col-span-4 row-span-2 bg-slate-900 rounded-3xl border border-slate-800 p-5 flex items-center gap-4 group cursor-pointer transition-all duration-300 shadow-lg hover:bg-slate-850 ${colors[idx % colors.length] || 'hover:border-red-500/40'}`}
                    >
                      <div className="w-14 h-14 rounded-2xl bg-slate-950 flex-shrink-0 border border-slate-800 flex items-center justify-center text-3xl group-hover:scale-110 transition-transform shadow-inner">
                        {ch.emoji}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h4 className="font-extrabold text-white truncate text-base">{ch.name}</h4>
                          <span className="text-[10px] font-bold text-red-500 uppercase flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                            Go <span className="text-xs">→</span>
                          </span>
                        </div>
                        <p className="text-slate-400 text-xs font-semibold">{ch.subscribers} {TRANSLATIONS[language].subscribers}</p>
                        <div className="mt-1.5 flex items-center justify-between">
                          <span className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{ch.tag}</span>
                          <span className="text-[10px] text-emerald-400 font-bold bg-emerald-500/5 px-2 py-0.5 rounded border border-emerald-500/10">{ch.growth}</span>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </>
            ) : (
              /* IF A CHANNEL IS FILTERED: TRANSFORM GRID BOTTOM TO SHOW DRILL-DOWN SUB-VIDEOS OF THAT CHANNEL! */
              <>
                {/* Back button bento card */}
                <div 
                  onClick={() => handleSelectChannel('all')}
                  className="col-span-12 md:col-span-4 row-span-2 bg-gradient-to-br from-slate-900 to-slate-950 rounded-3xl border border-slate-800 p-5 flex flex-col justify-between group cursor-pointer hover:border-slate-700 hover:bg-slate-850/30 transition-all duration-300 shadow-lg"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[9px] text-red-500 font-black tracking-wider uppercase bg-red-600/10 px-2 py-0.5 rounded border border-red-500/20">
                      {channels.find(c => c.id === activeChannelId)?.tag || 'BACK'}
                    </span>
                    <span className="text-xs text-slate-500">← {TRANSLATIONS[language].backLabel}</span>
                  </div>
                  <div>
                    <h4 className="font-extrabold text-white text-lg tracking-tight">
                      {channels.find(c => c.id === activeChannelId)?.name}
                    </h4>
                    <p className="text-slate-400 text-xs mt-1 leading-relaxed line-clamp-2">
                      {channels.find(c => c.id === activeChannelId)?.description}
                    </p>
                  </div>
                  <div className="text-xs font-extrabold text-red-500 flex items-center gap-1 group-hover:translate-x-1 transition-transform">
                    <span>← {TRANSLATIONS[language].viewAll}</span>
                  </div>
                </div>

                {/* Video clips catalogue blocks for this selected channel */}
                {filteredVideos.slice(0, 2).map((vid) => {
                  const ytId = getYoutubeVideoId(vid.url);
                  return (
                    <div
                      key={vid.id}
                      onClick={() => {
                        setActiveVideoId(vid.id);
                        setIsPlaying(true);
                      }}
                      className={`col-span-12 md:col-span-4 row-span-2 bg-slate-900 rounded-3xl border p-5 flex flex-col justify-between group cursor-pointer hover:bg-slate-850 transition-all duration-300 shadow-lg ${activeVideoId === vid.id ? 'border-red-600 ring-2 ring-red-600/30' : 'border-slate-800'}`}
                    >
                      <div className="flex justify-between items-start mb-3">
                        <span className="px-2 py-0.5 bg-slate-950 text-slate-400 rounded text-[9px] font-bold tracking-wider uppercase">
                          {vid.quality}
                        </span>
                        <span className="text-xs font-bold text-slate-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-slate-600" />
                          <span>{vid.duration}</span>
                        </span>
                      </div>

                      {ytId && (
                        <div className="w-full aspect-video rounded-xl overflow-hidden mb-3 relative bg-slate-950 border border-slate-800/40">
                          <img 
                            src={`https://img.youtube.com/vi/${ytId}/hqdefault.jpg`}
                            alt={vid.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            referrerPolicy="no-referrer"
                          />
                          <div className="absolute inset-0 bg-black/20 group-hover:bg-black/0 transition-colors"></div>
                        </div>
                      )}

                      <div className="my-1 flex-1">
                        <h4 className="font-bold text-white text-sm line-clamp-2 group-hover:text-red-400 transition-colors leading-snug">
                          {vid.title}
                        </h4>
                        <p className="text-slate-400 text-[11px] mt-1 line-clamp-1">{vid.views}</p>
                      </div>

                      <div className="flex items-center justify-between text-[10px] font-black tracking-widest text-red-500 pt-2 border-t border-slate-800/60 uppercase mt-2">
                        <span>{activeVideoId === vid.id ? '★ Playing Now' : 'Play Showcase'}</span>
                        <Play className={`w-3.5 h-3.5 ${activeVideoId === vid.id ? 'fill-current' : ''}`} />
                      </div>
                    </div>
                  );
                })}

                {/* If the channel has less than 2 videos, display placeholders */}
                {filteredVideos.length <= 1 && (
                  <div className="col-span-12 md:col-span-4 row-span-2 bg-slate-900/40 rounded-3xl border border-dashed border-slate-800/80 p-5 flex flex-col items-center justify-center text-center">
                    <Video className="w-8 h-8 text-slate-700 mb-1" />
                    <span className="text-xs text-slate-500 font-semibold">{TRANSLATIONS[language].noVideos}</span>
                  </div>
                )}
              </>
            )}

          </div>
        )}

        {/* INTERACTIVE VIDEO DETAILS, REVIEWS & COMMENTS (ONLY IF VIDEO EXISTS) */}
        {activeVideo && channels.length > 0 && (
          <div className="bg-slate-900 rounded-3xl border border-slate-800 p-6 md:p-8 mt-4 shadow-xl" id="comments-section">
            <div className="flex justify-between items-center border-b border-slate-800 pb-4 mb-6">
              <div className="flex items-center gap-6">
                <button
                  onClick={() => setActiveTab('info')}
                  className={`text-sm font-extrabold tracking-wider uppercase pb-2 relative transition-colors ${activeTab === 'info' ? 'text-white border-b-2 border-red-600' : 'text-slate-400 hover:text-white'}`}
                >
                  ⓘ Video Insights
                </button>
                <button
                  onClick={() => setActiveTab('comments')}
                  className={`text-sm font-extrabold tracking-wider uppercase pb-2 relative transition-colors ${activeTab === 'comments' ? 'text-white border-b-2 border-red-600' : 'text-slate-400 hover:text-white'}`}
                >
                  💬 {TRANSLATIONS[language].comments} ({activeComments.length})
                </button>
              </div>

              <div className="text-xs text-slate-400 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                <span>Active Showcase Stream</span>
              </div>
            </div>

            {activeTab === 'info' ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="col-span-2 space-y-4">
                  <h3 className="text-xl font-bold text-white">{activeVideo.title}</h3>
                  <p className="text-slate-300 text-xs md:text-sm leading-relaxed">{activeVideo.description}</p>
                  
                  {/* Share/Action row */}
                  <div className="flex flex-wrap items-center gap-3 pt-2">
                    <a
                      href={activeVideo.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-200 hover:text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5 text-red-500" />
                      <span>Watch on YouTube</span>
                    </a>
                    <button
                      onClick={() => handleLikeVideo(activeVideo.id)}
                      className="px-4 py-2 bg-red-600/10 hover:bg-red-600/20 border border-red-500/20 hover:border-red-500/40 text-red-400 hover:text-red-300 rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500/20" />
                      <span>{language === 'vi' ? 'Thích Video' : 'Like Video'} ({activeVideo.likes || 0})</span>
                    </button>
                    <button
                      onClick={() => {
                        handleIncrementViews(activeVideo.id);
                        showToast(language === 'vi' ? 'Đã tăng lượt xem!' : 'Incremented view count!', 'success');
                      }}
                      className="px-4 py-2 bg-slate-950 hover:bg-slate-850 border border-slate-800 text-slate-300 hover:text-white rounded-xl text-xs font-bold inline-flex items-center gap-2 transition-all cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5 text-red-500" />
                      <span>{language === 'vi' ? 'Tăng lượt xem' : 'Simulate View'} ({activeVideo.views})</span>
                    </button>
                  </div>
                </div>

                <div className="bg-slate-950 rounded-2xl border border-slate-800/60 p-5 space-y-4">
                  <span className="text-[10px] font-extrabold tracking-wider text-slate-500 uppercase block">Channel Affiliation</span>
                  
                  {(() => {
                    const channel = channels.find(c => c.id === activeVideo.channelId);
                    if (!channel) return null;
                    return (
                      <div className="space-y-3">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{channel.emoji}</span>
                          <div>
                            <h4 className="font-bold text-white text-sm">{channel.name}</h4>
                            <p className="text-xs text-slate-400">{channel.subscribers} Subscribers</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-400 leading-relaxed italic">"{channel.description}"</p>
                        <div className="pt-2 border-t border-slate-900">
                          <button
                            onClick={() => handleSelectChannel(channel.id)}
                            className="w-full py-2 bg-red-600/10 hover:bg-red-600/20 text-red-400 border border-red-500/20 rounded-xl text-xs font-bold transition-all cursor-pointer"
                          >
                            Filter Network by Channel
                          </button>
                        </div>
                      </div>
                    );
                  })()}
                </div>
              </div>
            ) : (
              // Live Comment Simulation
              <div className="space-y-6">
                
                {/* Send new comment form */}
                <form onSubmit={handleCommentSubmit} className="space-y-3">
                  <div className="flex flex-col sm:flex-row gap-3">
                    <input
                      type="text"
                      value={commentAuthor}
                      onChange={(e) => setCommentAuthor(e.target.value)}
                      placeholder={TRANSLATIONS[language].enterYourName}
                      className="px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-600 max-w-xs"
                    />
                    <div className="flex-1 flex gap-2">
                      <input
                        type="text"
                        value={commentText}
                        onChange={(e) => setCommentText(e.target.value)}
                        placeholder={TRANSLATIONS[language].writeComment}
                        className="flex-1 px-4 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-600"
                        required
                      />
                      <button
                        type="submit"
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all cursor-pointer"
                      >
                        <Send className="w-3.5 h-3.5" />
                        <span>{TRANSLATIONS[language].send}</span>
                      </button>
                    </div>
                  </div>
                </form>

                {/* Comment feeds */}
                <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2 divide-y divide-slate-800/50">
                  {activeComments.length === 0 ? (
                    <p className="text-xs text-slate-500 italic py-4">No comments on this video yet. Be the first to share your thoughts!</p>
                  ) : (
                    activeComments.map(c => (
                      <div key={c.id} className="pt-4 first:pt-0 flex justify-between items-start">
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-bold text-white flex items-center gap-1">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-700"></span>
                              {c.author}
                            </span>
                            <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                          </div>
                          <p className="text-slate-300 text-xs pl-3.5 leading-relaxed">{c.text}</p>
                        </div>
                        
                        <button
                          onClick={() => handleLikeComment(c.id)}
                          className="px-2.5 py-1 bg-slate-950 hover:bg-slate-850 border border-slate-800/80 rounded-lg text-[10px] font-bold text-slate-400 hover:text-red-400 flex items-center gap-1.5 transition-all cursor-pointer"
                        >
                          <Heart className="w-3 h-3 text-red-500 fill-red-500/10" />
                          <span>{c.likes}</span>
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Footer info (Los Angeles, New York, etc.) */}
        <footer className="mt-8 pt-6 border-t border-slate-900 flex flex-col md:flex-row justify-between items-center gap-4 text-[10px] text-slate-500 font-black tracking-widest uppercase">
          <div>&copy; {new Date().getFullYear()} ANHY NETWORK GLOBAL. ALL RIGHTS RESERVED.</div>
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-slate-400">
            <Sparkles className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            <span>Empowering Global Voices & Creative Engineering</span>
          </div>
          <div className="flex gap-6">
            <span className="hover:text-red-500 transition-colors">LOS ANGELES</span>
            <span className="hover:text-red-500 transition-colors">NEW YORK</span>
            <span className="hover:text-red-500 transition-colors">HA NOI</span>
          </div>
        </footer>

      </div>

      {/* MODAL: BOOK A CALL / SPONSORSHIP FORM */}
      {isBookingOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-[fadeIn_0.3s_ease]">
            <button
              onClick={() => setIsBookingOpen(false)}
              className="absolute top-5 right-5 p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800/60 transition-all cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="p-6 md:p-8 space-y-4">
              <div className="flex items-center gap-2">
                <Calendar className="w-5 h-5 text-red-500" />
                <h3 className="text-xl font-extrabold tracking-tight text-white">{TRANSLATIONS[language].bookingFormTitle}</h3>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">{TRANSLATIONS[language].bookingSubtitle}</p>

              {bookingSuccess ? (
                <div className="p-6 bg-emerald-950/20 border border-emerald-500/30 rounded-2xl text-center space-y-3">
                  <Check className="w-10 h-10 text-emerald-400 mx-auto bg-emerald-500/10 p-2 rounded-full" />
                  <p className="text-sm font-bold text-emerald-300">{TRANSLATIONS[language].bookingSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="space-y-4 pt-2">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{TRANSLATIONS[language].fullName} *</label>
                      <input
                        type="text"
                        required
                        value={bookingForm.fullName}
                        onChange={(e) => setBookingForm({ ...bookingForm, fullName: e.target.value })}
                        placeholder="John Doe"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30"
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{TRANSLATIONS[language].emailAddress} *</label>
                      <input
                        type="email"
                        required
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({ ...bookingForm, email: e.target.value })}
                        placeholder="john@example.com"
                        className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-600 focus:ring-1 focus:ring-red-600/30"
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{TRANSLATIONS[language].companyName}</label>
                    <input
                      type="text"
                      value={bookingForm.companyName}
                      onChange={(e) => setBookingForm({ ...bookingForm, companyName: e.target.value })}
                      placeholder="Acme Corp / TechChannel"
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-600"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{TRANSLATIONS[language].purpose}</label>
                    <select
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({ ...bookingForm, purpose: e.target.value })}
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-slate-300 focus:outline-none focus:border-red-600"
                    >
                      <option value="">-- {TRANSLATIONS[language].selectPurpose} --</option>
                      <option value="sponsorship">{TRANSLATIONS[language].sponsorship}</option>
                      <option value="collab">{TRANSLATIONS[language].collab}</option>
                      <option value="consultation">{TRANSLATIONS[language].consultation}</option>
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black uppercase text-slate-400 tracking-wider">{TRANSLATIONS[language].message}</label>
                    <textarea
                      rows={3}
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm({ ...bookingForm, message: e.target.value })}
                      placeholder="Hello, we would like to sponsor your next tech video with a 60s integration..."
                      className="w-full px-4 py-2.5 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-red-600 resize-none"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-widest transition-all cursor-pointer shadow-lg shadow-red-600/20 active:scale-95"
                  >
                    {TRANSLATIONS[language].submitBooking}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL: CREATOR PANEL & SETTINGS CONTROL CENTER */}
      {isAdminOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-hidden shadow-2xl flex flex-col animate-[fadeIn_0.3s_ease]">
            
            {/* Header */}
            <div className="p-6 border-b border-slate-800 flex justify-between items-center bg-slate-950/40">
              <div className="flex items-center gap-2.5">
                <Settings className="w-6 h-6 text-red-500 animate-[spin_4s_linear_infinite]" />
                <div>
                  <h3 className="text-lg font-black tracking-tight text-white uppercase">{TRANSLATIONS[language].adminPanelTitle}</h3>
                  <p className="text-[11px] text-slate-500 mt-0.5">{TRANSLATIONS[language].adminPanelSub}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={handleResetToDefault}
                  className="px-3 py-1.5 bg-red-950/20 hover:bg-red-900/20 text-red-400 border border-red-500/20 rounded-xl text-[10px] font-bold tracking-wider transition-all cursor-pointer"
                >
                  {TRANSLATIONS[language].resetToDefault}
                </button>
                <button
                  onClick={() => setIsAdminOpen(false)}
                  className="p-2 bg-slate-950 hover:bg-slate-800 text-slate-400 hover:text-white rounded-xl border border-slate-800/60 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Scrollable Layout */}
            <div className="flex-1 overflow-y-auto p-6 md:p-8 space-y-8">
              
              {userRole !== 'admin' && (
                <div className="p-4 bg-amber-500/10 border border-amber-500/20 rounded-2xl flex items-start gap-3 animate-[fadeIn_0.25s_ease]">
                  <Shield className="w-5 h-5 text-amber-500 mt-0.5 flex-shrink-0" />
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-amber-400">
                      {language === 'vi' 
                        ? `Bạn đang ở chế độ giới hạn quyền (${userRole === 'editor' ? 'Biên Tập Viên' : 'Người Xem'})`
                        : `You are currently in restricted mode (${userRole === 'editor' ? 'Editor' : 'Viewer'})`}
                    </p>
                    <p className="text-[11px] text-slate-400 leading-relaxed">
                      {language === 'vi'
                        ? 'Để tạo mới, sửa đổi thông tin kênh, video hoặc quản lý phân quyền thành viên, vui lòng sử dụng thanh gạt chuyển đổi vai trò 👑 Admin ở góc trên bên phải màn hình.'
                        : 'To create, edit channel information, videos, or manage member permissions, please select the 👑 Admin role from the dropdown menu in the top-right corner.'}
                    </p>
                  </div>
                </div>
              )}

              {/* SECTION A: CHANNELS DIRECTORY */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                    <Layers className="w-4 h-4 text-red-500" />
                    <span>{TRANSLATIONS[language].channelSettings}</span>
                  </h4>
                  {userRole === 'admin' && (
                    <button
                      onClick={() => setEditingChannel({})}
                      className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>{TRANSLATIONS[language].addChannel}</span>
                    </button>
                  )}
                </div>

                {/* Edit Channel Form Inline */}
                {editingChannel && (
                  <form onSubmit={handleSaveChannel} className="bg-slate-950 p-5 rounded-2xl border border-red-500/30 space-y-4 animate-[slideDown_0.2s_ease]">
                    <h5 className="text-xs font-bold text-red-400 uppercase">
                      {editingChannel.id ? TRANSLATIONS[language].editChannel : TRANSLATIONS[language].addChannel}
                    </h5>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Name</label>
                        <input
                          type="text"
                          required
                          value={editingChannel.name || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="V-Vlogs"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Emoji Icon</label>
                        <input
                          type="text"
                          required
                          value={editingChannel.emoji || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, emoji: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="⭐"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Subscribers (e.g. 1.5M)</label>
                        <input
                          type="text"
                          required
                          value={editingChannel.subscribers || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, subscribers: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="1.2M"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Tag (e.g. COOKING)</label>
                        <input
                          type="text"
                          required
                          value={editingChannel.tag || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, tag: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="LIFESTYLE"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Growth State</label>
                        <input
                          type="text"
                          value={editingChannel.growth || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, growth: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="+12% growth"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Theme Accent</label>
                        <select
                          value={editingChannel.accent || 'red'}
                          onChange={(e) => setEditingChannel({ ...editingChannel, accent: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300"
                        >
                          <option value="red">Red Accent</option>
                          <option value="indigo">Indigo Accent</option>
                          <option value="amber">Amber Accent</option>
                          <option value="emerald">Emerald Accent</option>
                        </select>
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Total Views</label>
                        <input
                          type="text"
                          value={editingChannel.views || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, views: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="12.5M"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">Short Pitch / Description</label>
                      <input
                        type="text"
                        value={editingChannel.description || ''}
                        onChange={(e) => setEditingChannel({ ...editingChannel, description: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        placeholder="A premium channel exploring cooking and lifestyle diets"
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Link Truy cập kênh / YouTube Channel URL</label>
                        <input
                          type="text"
                          value={editingChannel.channelUrl || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, channelUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="E.g. https://www.youtube.com/@mychannel"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Link Đăng ký kênh / YouTube Subscribe URL</label>
                        <input
                          type="text"
                          value={editingChannel.subscribeUrl || ''}
                          onChange={(e) => setEditingChannel({ ...editingChannel, subscribeUrl: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="E.g. https://www.youtube.com/@mychannel?sub_confirmation=1"
                        />
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingChannel(null)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-400"
                      >
                        {TRANSLATIONS[language].cancel}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
                      >
                        {TRANSLATIONS[language].saveChanges}
                      </button>
                    </div>
                  </form>
                )}

                {/* Table of channels */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                  <div className="grid grid-cols-12 gap-2 bg-slate-950 px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <div className="col-span-1">Icon</div>
                    <div className="col-span-3">Name</div>
                    <div className="col-span-2">Subscribers</div>
                    <div className="col-span-2">Tag</div>
                    <div className="col-span-3">Growth</div>
                    <div className="col-span-1 text-center">Action</div>
                  </div>
                  <div className="divide-y divide-slate-900">
                    {channels.map(ch => (
                      <div key={ch.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs text-slate-300">
                        <div className="col-span-1 text-xl">{ch.emoji}</div>
                        <div className="col-span-3 font-bold text-white">{ch.name}</div>
                        <div className="col-span-2">{ch.subscribers}</div>
                        <div className="col-span-2"><span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] font-semibold text-slate-400 border border-slate-850">{ch.tag}</span></div>
                        <div className="col-span-3 text-emerald-400 font-bold">{ch.growth}</div>
                        <div className="col-span-1 flex justify-center gap-1">
                          {userRole === 'admin' ? (
                            <>
                              <button
                                onClick={() => setEditingChannel(ch)}
                                className="p-1 hover:text-white text-slate-500 transition-colors cursor-pointer"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                onClick={() => handleDeleteChannel(ch.id)}
                                className="p-1 text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </>
                          ) : (
                            <span className="text-xs text-slate-600 select-none" title="Only Admin can manage channels">🔒</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* SECTION B: SHOWCASE VIDEOS CATALOG */}
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <h4 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                    <Video className="w-4 h-4 text-red-500" />
                    <span>{TRANSLATIONS[language].videoSettings}</span>
                  </h4>
                  <button
                    onClick={() => setEditingVideo({ channelId: channels[0]?.id || '' })}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{TRANSLATIONS[language].addVideo}</span>
                  </button>
                </div>

                {/* Edit Video Form Inline */}
                {editingVideo && (
                  <form onSubmit={handleSaveVideo} className="bg-slate-950 p-5 rounded-2xl border border-red-500/30 space-y-4 animate-[slideDown_0.2s_ease]">
                    <h5 className="text-xs font-bold text-red-400 uppercase">
                      {editingVideo.id ? 'Edit Video Clip' : 'Add Video Clip Showcase'}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Channel Origin *</label>
                        <select
                          required
                          value={editingVideo.channelId || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, channelId: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                        >
                          <option value="">Select Channel</option>
                          {channels.map(c => (
                            <option key={c.id} value={c.id}>{c.emoji} {c.name}</option>
                          ))}
                        </select>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{TRANSLATIONS[language].videoTitle} *</label>
                        <input
                          type="text"
                          required
                          value={editingVideo.title || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="E.g. Building Next-Gen UI"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{TRANSLATIONS[language].videoUrl} *</label>
                        <input
                          type="text"
                          required
                          value={editingVideo.url || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="YouTube ID (e.g., Ke90Tje7VS0) or Full URL"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{TRANSLATIONS[language].videoDuration}</label>
                        <input
                          type="text"
                          value={editingVideo.duration || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="12:44"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">{TRANSLATIONS[language].videoQuality}</label>
                        <input
                          type="text"
                          value={editingVideo.quality || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, quality: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="4K HDR"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lượt xem / Views</label>
                        <input
                          type="text"
                          value={editingVideo.views || ''}
                          onChange={(e) => setEditingVideo({ ...editingVideo, views: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="240K lượt xem / 240,000 views"
                        />
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Lượt thích / Likes</label>
                        <input
                          type="number"
                          value={editingVideo.likes ?? 0}
                          onChange={(e) => setEditingVideo({ ...editingVideo, likes: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="18420"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">{TRANSLATIONS[language].videoDesc}</label>
                      <input
                        type="text"
                        value={editingVideo.description || ''}
                        onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                        placeholder="Explain video focus here..."
                      />
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingVideo(null)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-400"
                      >
                        {TRANSLATIONS[language].cancel}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
                      >
                        {TRANSLATIONS[language].saveChanges}
                      </button>
                    </div>
                  </form>
                )}

                {/* Table of videos */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20">
                  <div className="grid grid-cols-12 gap-2 bg-slate-950 px-4 py-3 text-[10px] font-black text-slate-500 uppercase tracking-widest border-b border-slate-800">
                    <div className="col-span-3">Channel</div>
                    <div className="col-span-4">Title</div>
                    <div className="col-span-3">YouTube URL / ID</div>
                    <div className="col-span-1">Duration</div>
                    <div className="col-span-1 text-center font-bold">Action</div>
                  </div>
                  <div className="divide-y divide-slate-900">
                    {videos.map(v => {
                      const parentChannel = channels.find(c => c.id === v.channelId);
                      return (
                        <div key={v.id} className="grid grid-cols-12 gap-2 px-4 py-3 items-center text-xs text-slate-300">
                          <div className="col-span-3 font-semibold text-slate-400 flex items-center gap-1">
                            <span>{parentChannel?.emoji || '🎥'}</span>
                            <span className="truncate">{parentChannel?.name || 'Deleted Channel'}</span>
                          </div>
                          <div className="col-span-4 font-bold text-white truncate">{v.title}</div>
                          <div className="col-span-3 font-mono text-[11px] truncate text-slate-500">{v.url}</div>
                          <div className="col-span-1">{v.duration}</div>
                          <div className="col-span-1 flex justify-center gap-1">
                            <button
                              onClick={() => setEditingVideo(v)}
                              className="p-1 hover:text-white text-slate-500 transition-colors cursor-pointer"
                              title="Edit"
                            >
                              ✏️
                            </button>
                            {userRole === 'admin' && (
                              <button
                                onClick={() => handleDeleteVideo(v.id)}
                                className="p-1 text-slate-500 hover:text-red-500 transition-colors cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* SECTION: MASTERCLASS CONFIGURATION */}
              <div className="space-y-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
                <h4 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                  <Video className="w-4 h-4 text-red-500" />
                  <span>Cấu hình Lớp Học Chiến Lược / Masterclass Settings</span>
                  {userRole !== 'admin' && (
                    <span className="px-1.5 py-0.5 bg-slate-900 text-[9px] text-slate-500 rounded border border-slate-800">🔒 Admin Only</span>
                  )}
                </h4>
                {userRole !== 'admin' ? (
                  <div className="p-8 bg-slate-950/20 rounded-2xl border border-slate-900 text-center text-slate-500 space-y-2">
                    <p className="text-xs font-bold text-slate-400">🔒 {language === 'vi' ? 'Quyền truy cập bị giới hạn' : 'Restricted Access'}</p>
                    <p className="text-[11px] text-slate-600">{language === 'vi' ? 'Chỉ Quản Trị Viên mới có quyền cấu hình lớp học chiến lược.' : 'Only Administrators have permission to modify masterclass settings.'}</p>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Vietnamese translation */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block border-b border-slate-900 pb-1">Phiên bản Tiếng Việt</span>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Tiêu đề lớp học (Mặc định: Lớp Học Chiến Lược Cuối Tuần)</label>
                          <input
                            type="text"
                            value={masterclassTitleVi}
                            onChange={(e) => setMasterclassTitleVi(e.target.value)}
                            placeholder={TRANSLATIONS.vi.masterclassTitle}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Lịch trình / Phụ đề (Mặc định: Chủ Nhật lúc 10:00 AM EST (21:00 VN))</label>
                          <input
                            type="text"
                            value={masterclassSubVi}
                            onChange={(e) => setMasterclassSubVi(e.target.value)}
                            placeholder={TRANSLATIONS.vi.masterclassSub}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>

                      {/* English translation */}
                      <div className="space-y-3">
                        <span className="text-[10px] font-extrabold text-red-400 uppercase tracking-wider block border-b border-slate-900 pb-1">English Version</span>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Masterclass Title (Default: Join the Weekend Masterclass)</label>
                          <input
                            type="text"
                            value={masterclassTitleEn}
                            onChange={(e) => setMasterclassTitleEn(e.target.value)}
                            placeholder={TRANSLATIONS.en.masterclassTitle}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-slate-500 uppercase">Schedule / Subtitle (Default: Sundays at 10:00 AM EST)</label>
                          <input
                            type="text"
                            value={masterclassSubEn}
                            onChange={(e) => setMasterclassSubEn(e.target.value)}
                            placeholder={TRANSLATIONS.en.masterclassSub}
                            className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-end pt-2 border-t border-slate-900">
                      <button
                        type="button"
                        onClick={handleSaveMasterclass}
                        className="px-5 py-2 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-all shadow-md shadow-red-950/40 cursor-pointer"
                      >
                        <Check className="w-4 h-4" />
                        <span>Lưu cấu hình / Save Settings</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION C: RECEIVED PROPOSALS (LEADS FOR SPONSORSHIPS) */}
              <div className="space-y-4">
                <h4 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                  <Briefcase className="w-4 h-4 text-red-500" />
                  <span>{TRANSLATIONS[language].receivedBookings} ({bookings.length})</span>
                  {userRole !== 'admin' && (
                    <span className="px-1.5 py-0.5 bg-slate-900 text-[9px] text-slate-500 rounded border border-slate-800">🔒 Admin Only</span>
                  )}
                </h4>

                {userRole !== 'admin' ? (
                  <div className="p-8 bg-slate-950/20 rounded-2xl border border-slate-900 text-center text-slate-500 space-y-2">
                    <p className="text-xs font-bold text-slate-400">🔒 {language === 'vi' ? 'Quyền truy cập bị giới hạn' : 'Restricted Access'}</p>
                    <p className="text-[11px] text-slate-600">{language === 'vi' ? 'Chỉ Quản Trị Viên mới có quyền xem các yêu cầu hợp tác tài trợ.' : 'Only Administrators have permission to view collaboration and sponsorship proposals.'}</p>
                  </div>
                ) : bookings.length === 0 ? (
                  <div className="p-6 bg-slate-950/40 rounded-2xl border border-dashed border-slate-800 text-center text-slate-500 text-xs">
                    {TRANSLATIONS[language].noBookings}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {bookings.map(b => (
                      <div key={b.id} className="p-5 bg-slate-950 border border-slate-800 rounded-2xl space-y-3 relative group">
                        <button
                          onClick={() => handleDeleteBooking(b.id)}
                          className="absolute top-4 right-4 text-slate-500 hover:text-red-400 p-1"
                          title="Delete Request"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                        <div className="flex flex-wrap justify-between items-start gap-2 border-b border-slate-900 pb-2">
                          <div>
                            <h5 className="font-bold text-white text-sm">{b.fullName}</h5>
                            <p className="text-xs text-slate-400">{b.email} • {b.companyName || 'No Company'}</p>
                          </div>
                          <div className="text-right">
                            <span className="px-2 py-0.5 bg-red-600/10 text-red-400 rounded text-[9px] font-black uppercase tracking-wider border border-red-500/20">
                              {b.purpose}
                            </span>
                            <p className="text-[9px] text-slate-500 mt-1">{b.timestamp}</p>
                          </div>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed italic bg-slate-900/40 p-3 rounded-lg border border-slate-900">
                          "{b.message || 'No message details provided.'}"
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* SECTION D: COMMUNITY COMMENTS MANAGEMENT */}
              <div className="space-y-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
                <div className="flex justify-between items-center flex-wrap gap-2">
                  <h4 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-red-500" />
                    <span>{language === 'vi' ? 'Quản lý Bình luận Thực tế' : 'Community Comments Manager'}</span>
                  </h4>
                  <button
                    type="button"
                    onClick={() => {
                      setEditingComment({
                        videoId: adminCommentVideoId || videos[0]?.id || '',
                        author: '',
                        text: '',
                        timestamp: language === 'vi' ? '2 giờ trước' : '2 hours ago',
                        likes: 0
                      });
                    }}
                    className="px-3 py-1 bg-red-600 hover:bg-red-700 text-white rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{language === 'vi' ? 'Thêm bình luận thực tế' : 'Add Comment'}</span>
                  </button>
                </div>

                {/* Filter video */}
                <div className="space-y-1 bg-slate-900/60 p-3 rounded-xl border border-slate-800">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">
                    {language === 'vi' ? 'Chọn Video để xem & chỉnh sửa bình luận:' : 'Select Video to Manage Comments:'}
                  </label>
                  <select
                    value={adminCommentVideoId || (videos[0]?.id || '')}
                    onChange={(e) => setAdminCommentVideoId(e.target.value)}
                    className="w-full px-3 py-1.5 bg-slate-950 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                  >
                    {videos.map(v => (
                      <option key={v.id} value={v.id}>{v.title}</option>
                    ))}
                  </select>
                </div>

                {/* Edit/Create Comment Form */}
                {editingComment && (
                  <form onSubmit={handleSaveComment} className="bg-slate-950 p-5 rounded-2xl border border-red-500/30 space-y-4 animate-[slideDown_0.2s_ease]">
                    <h5 className="text-xs font-bold text-red-400 uppercase">
                      {editingComment.id 
                        ? (language === 'vi' ? 'Sửa bình luận' : 'Edit Comment') 
                        : (language === 'vi' ? 'Thêm bình luận mới' : 'Add New Comment')}
                    </h5>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          {language === 'vi' ? 'Tác giả / Người viết *' : 'Author *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={editingComment.author || ''}
                          onChange={(e) => setEditingComment({ ...editingComment, author: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="e.g. Minh Tuấn Tech"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          {language === 'vi' ? 'Thời gian hiển thị *' : 'Timestamp *'}
                        </label>
                        <input
                          type="text"
                          required
                          value={editingComment.timestamp || ''}
                          onChange={(e) => setEditingComment({ ...editingComment, timestamp: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="e.g. 2 giờ trước"
                        />
                      </div>
                    </div>

                    <div className="space-y-1">
                      <label className="text-[10px] font-bold text-slate-500 uppercase">
                        {language === 'vi' ? 'Nội dung bình luận *' : 'Comment Text *'}
                      </label>
                      <textarea
                        required
                        rows={2}
                        value={editingComment.text || ''}
                        onChange={(e) => setEditingComment({ ...editingComment, text: e.target.value })}
                        className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white resize-none"
                        placeholder="..."
                      />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          {language === 'vi' ? 'Lượt thích bình luận' : 'Comment Likes'}
                        </label>
                        <input
                          type="number"
                          value={editingComment.likes ?? 0}
                          onChange={(e) => setEditingComment({ ...editingComment, likes: parseInt(e.target.value, 10) || 0 })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white"
                          placeholder="12"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">
                          {language === 'vi' ? 'Gắn vào video' : 'Attach to Video'}
                        </label>
                        <select
                          value={editingComment.videoId || ''}
                          onChange={(e) => setEditingComment({ ...editingComment, videoId: e.target.value })}
                          className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-300 focus:outline-none"
                        >
                          {videos.map(v => (
                            <option key={v.id} value={v.id}>{v.title}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    <div className="flex gap-2 justify-end">
                      <button
                        type="button"
                        onClick={() => setEditingComment(null)}
                        className="px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-xl text-xs text-slate-400"
                      >
                        {TRANSLATIONS[language].cancel}
                      </button>
                      <button
                        type="submit"
                        className="px-4 py-1.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl text-xs"
                      >
                        {TRANSLATIONS[language].saveChanges}
                      </button>
                    </div>
                  </form>
                )}

                {/* Table of Comments */}
                <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20 max-h-[250px] overflow-y-auto">
                  {(() => {
                    const targetVideoId = adminCommentVideoId || videos[0]?.id || '';
                    const targetComments = comments.filter(c => c.videoId === targetVideoId);
                    if (targetComments.length === 0) {
                      return (
                        <div className="p-6 text-center text-slate-500 text-xs italic">
                          {language === 'vi' 
                            ? 'Chưa có bình luận thực tế nào cho video này. Hãy nhấp "Thêm bình luận thực tế"!' 
                            : 'No comments for this video yet. Click "Add Comment" to create!'}
                        </div>
                      );
                    }
                    return (
                      <div className="divide-y divide-slate-900">
                        {targetComments.map(c => (
                          <div key={c.id} className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-3 hover:bg-slate-900/10 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{c.author}</span>
                                <span className="text-[10px] text-slate-500">{c.timestamp}</span>
                                <span className="px-1.5 py-0.5 bg-slate-900 rounded text-[9px] text-slate-400 border border-slate-800">
                                  ❤️ {c.likes} {TRANSLATIONS[language].likesCount}
                                </span>
                              </div>
                              <p className="text-xs text-slate-300 leading-relaxed italic">"{c.text}"</p>
                            </div>
                            <div className="flex items-center gap-1.5 self-end sm:self-center">
                              <button
                                type="button"
                                onClick={() => setEditingComment(c)}
                                className="px-2 py-1 bg-slate-900 hover:bg-slate-850 border border-slate-800 text-slate-400 hover:text-white rounded-lg text-[11px] cursor-pointer"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              {userRole === 'admin' && (
                                <button
                                  type="button"
                                  onClick={() => handleDeleteComment(c.id)}
                                  className="px-2 py-1 bg-red-950/20 hover:bg-red-950/50 border border-red-900/25 text-red-400 hover:text-red-300 rounded-lg text-[11px] cursor-pointer"
                                  title="Delete"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    );
                  })()}
                </div>
              </div>

              {/* SECTION E: USER & PERMISSION MANAGEMENT */}
              {userRole === 'admin' && (
                <div className="space-y-4 bg-slate-950/40 p-6 rounded-2xl border border-slate-800">
                  <div className="flex justify-between items-center flex-wrap gap-2">
                    <h4 className="text-xs font-black tracking-widest text-white uppercase flex items-center gap-1.5">
                      <Shield className="w-4 h-4 text-red-500" />
                      <span>{language === 'vi' ? 'Quản Lý Người Dùng & Phân Quyền' : TRANSLATIONS[language].usersList}</span>
                    </h4>
                    <span className="px-2 py-0.5 bg-red-600/10 text-red-500 rounded text-[9px] font-black uppercase tracking-wider border border-red-500/20">
                      Real-time DB Sync
                    </span>
                  </div>

                  <p className="text-[11px] text-slate-500">
                    {language === 'vi' 
                      ? 'Danh sách thành viên đăng ký trong hệ thống. Bạn có thể thay đổi vai trò (Admin, Editor, Viewer) trực tiếp, quyền hạn sẽ tự động cập nhật thời gian thực vào cơ sở dữ liệu Firestore.' 
                      : 'List of members registered in the system. You can change their roles (Admin, Editor, Viewer) directly, and permissions will be updated in real-time in the Firestore database.'}
                  </p>

                  <div className="border border-slate-800 rounded-2xl overflow-hidden bg-slate-950/20 max-h-[300px] overflow-y-auto">
                    {allUsersList.length === 0 ? (
                      <div className="p-6 text-center text-slate-500 text-xs italic">
                        {TRANSLATIONS[language].noUsers}
                      </div>
                    ) : (
                      <div className="divide-y divide-slate-900">
                        {allUsersList.map(u => (
                          <div key={u.uid} className="p-3.5 flex flex-col sm:flex-row justify-between sm:items-center gap-4 hover:bg-slate-900/10 transition-colors">
                            <div className="space-y-1">
                              <div className="flex items-center gap-2 flex-wrap">
                                <span className="font-bold text-white text-xs">{u.displayName}</span>
                                {currentUser?.uid === u.uid && (
                                  <span className="px-1.5 py-0.5 bg-slate-900 text-slate-400 rounded text-[9px] border border-slate-800">
                                    {language === 'vi' ? 'Bạn' : 'You'}
                                  </span>
                                )}
                              </div>
                              <p className="text-xs text-slate-400 font-mono select-all">{u.email}</p>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-center">
                              {/* Role select */}
                              <select
                                value={u.role}
                                onChange={(e) => handleUpdateUserRole(u.uid, e.target.value as 'admin' | 'editor' | 'viewer')}
                                disabled={currentUser?.uid === u.uid}
                                className="px-2 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-slate-200 focus:outline-none focus:ring-1 focus:ring-red-500 disabled:opacity-50 cursor-pointer"
                              >
                                <option value="admin">👑 Admin</option>
                                <option value="editor">✍️ Editor</option>
                                <option value="viewer">👁️ Viewer</option>
                              </select>

                              {/* Delete account profile */}
                              <button
                                type="button"
                                disabled={currentUser?.uid === u.uid}
                                onClick={() => handleDeleteUserProfile(u.uid)}
                                className="p-1.5 bg-red-950/20 hover:bg-red-950/50 border border-red-900/25 text-red-400 hover:text-red-300 rounded-xl cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                                title={TRANSLATIONS[language].delete}
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

            {/* Footer buttons of modal */}
            <div className="p-6 border-t border-slate-800 bg-slate-950/20 flex justify-end">
              <button
                onClick={() => setIsAdminOpen(false)}
                className="px-6 py-2.5 bg-white text-black font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer transition-all hover:bg-slate-200"
              >
                {TRANSLATIONS[language].close}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: AUTHENTICATION (LOGIN & REGISTER) */}
      {isAuthOpen && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-md flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-md p-6 relative shadow-2xl animate-[fadeIn_0.25s_ease] space-y-6">
            <button
              onClick={() => setIsAuthOpen(false)}
              className="absolute top-4 right-4 p-2 bg-slate-950 hover:bg-slate-850 text-slate-400 hover:text-white rounded-xl border border-slate-800 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-1.5 pt-2">
              <div className="w-12 h-12 bg-red-600 rounded-2xl flex items-center justify-center font-bold text-2xl text-white shadow-lg shadow-red-600/20 mx-auto">
                {authMode === 'login' ? <Lock className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
              </div>
              <h3 className="text-lg font-black tracking-tight text-white uppercase pt-1">
                {authMode === 'login' ? TRANSLATIONS[language].login : TRANSLATIONS[language].register}
              </h3>
              <p className="text-[11px] text-slate-500">
                {authMode === 'login' 
                  ? (language === 'vi' ? 'Đăng nhập vào hệ thống AnHy Network để chỉnh sửa và quản lý' : 'Log in to AnHy Network to manage details')
                  : (language === 'vi' ? 'Tạo tài khoản mới để tham gia mạng lưới' : 'Create a new account to join the network')}
              </p>
            </div>

            <form onSubmit={authMode === 'login' ? handleAuthSignIn : handleAuthSignUp} className="space-y-4">
              {authMode === 'register' && (
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    {TRANSLATIONS[language].name}
                  </label>
                  <input
                    type="text"
                    required
                    value={authDisplayName}
                    onChange={(e) => setAuthDisplayName(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                    placeholder="e.g. Hoàng Nam"
                  />
                </div>
              )}

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {TRANSLATIONS[language].email}
                </label>
                <input
                  type="text"
                  required
                  value={authEmail}
                  onChange={(e) => setAuthEmail(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                  placeholder={language === 'vi' ? 'Ví dụ: admin, hoangnam...' : 'e.g. admin, testuser...'}
                />
              </div>

              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                  {TRANSLATIONS[language].password}
                </label>
                <input
                  type="password"
                  required
                  value={authPassword}
                  onChange={(e) => setAuthPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-950 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-600 focus:outline-none focus:border-red-500/50"
                  placeholder="••••••••"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 bg-red-600 hover:bg-red-700 text-white font-extrabold rounded-xl text-xs uppercase tracking-wider cursor-pointer shadow-lg shadow-red-600/10 transition-all mt-2 active:scale-[0.98]"
              >
                {authMode === 'login' ? TRANSLATIONS[language].login : TRANSLATIONS[language].register}
              </button>
            </form>

            <div className="text-center pt-2 border-t border-slate-800/50">
              <button
                type="button"
                onClick={() => {
                  setAuthMode(authMode === 'login' ? 'register' : 'login');
                  setAuthPassword('');
                }}
                className="text-[11px] text-red-400 hover:text-red-300 transition-colors font-medium cursor-pointer"
              >
                {authMode === 'login' 
                  ? (language === 'vi' ? 'Chưa có tài khoản? Đăng ký ngay' : "Don't have an account? Sign Up")
                  : (language === 'vi' ? 'Đã có tài khoản? Đăng nhập' : 'Already have an account? Log In')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Premium Toast Notification */}
      {toastMessage && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl border backdrop-blur-md shadow-2xl transition-all duration-300 transform translate-y-0 scale-100 ${
          toastType === 'success' ? 'bg-emerald-950/95 border-emerald-500/30 text-emerald-200' :
          toastType === 'error' ? 'bg-red-950/95 border-red-500/30 text-red-200' :
          'bg-slate-950/95 border-slate-800 text-slate-200'
        }`}>
          <span className="text-sm">
            {toastType === 'success' ? '✅' : toastType === 'error' ? '❌' : 'ℹ️'}
          </span>
          <p className="text-xs font-semibold leading-relaxed max-w-xs">{toastMessage}</p>
        </div>
      )}

    </div>
  );
}
