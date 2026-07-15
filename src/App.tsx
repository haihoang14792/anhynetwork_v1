import React, { useState, useEffect, useMemo } from 'react';
import { db, auth, handleFirestoreError, OperationType } from './firebase';
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
  updateProfile,
  onAuthStateChanged
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
  Clock,
  Briefcase,
  Youtube,
  Bell,
  LogIn,
  LogOut,
  UserPlus,
  Shield,
  Lock,
  Edit2,
  Search,
  Share2,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Minimize2,
  Maximize2,
  EyeOff,
  ChevronLeft,
  ChevronRight,
  Filter,
  SlidersHorizontal,
  ArrowUpDown
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

// TS Interfaces
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
  isHidden?: boolean;
  joinedYear?: string;
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
  dislikes: number;
  thumbnailGradient: string;
  isLive?: boolean;
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
    subscribeUrl: 'https://www.youtube.com/@v_tech_ai?sub_confirmation=1',
    joinedYear: '2023'
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
    subscribeUrl: 'https://www.youtube.com/@v_life_travel?sub_confirmation=1',
    joinedYear: '2024'
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
    subscribeUrl: 'https://www.youtube.com/@v_finance?sub_confirmation=1',
    joinedYear: '2025'
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
    dislikes: 120,
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
    dislikes: 85,
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
    dislikes: 320,
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
    views: '410K lượt xem',
    likes: 29500,
    dislikes: 145,
    thumbnailGradient: 'from-slate-950 via-amber-900/30 to-slate-900'
  },
  {
    id: 'vid-5',
    channelId: 'v-finance',
    title: 'How to Invest Your First $10,000 in 2026',
    url: 'https://www.youtube.com/watch?v=kY67Z3v_G7o',
    description: 'Chiến lược phân bổ tài sản hiệu quả nhất giữa quỹ ETF chỉ số, trái phiếu chính phủ ngắn hạn và cách tránh bẫy tâm lý đám đông.',
    duration: '14:50',
    quality: '4K HDR',
    views: '310K lượt xem',
    likes: 24100,
    dislikes: 95,
    thumbnailGradient: 'from-slate-950 via-emerald-950/40 to-slate-900'
  }
];

const DEFAULT_COMMENTS: Comment[] = [
  {
    id: 'c-1',
    videoId: 'vid-1',
    author: 'Minh Hoàng',
    text: 'Giải thích cực kỳ trực quan và cập nhật xu hướng AI 2026 rất chính xác. Cảm ơn AnHy!',
    timestamp: '10/07/2026, 11:24:00 AM',
    likes: 42
  },
  {
    id: 'c-2',
    videoId: 'vid-1',
    author: 'Sarah Jenkins',
    text: 'Love the high quality editing and professional presentation of the AI landscape.',
    timestamp: '11/07/2026, 09:15:30 AM',
    likes: 18
  },
  {
    id: 'c-3',
    videoId: 'vid-3',
    author: 'Quốc Bảo',
    text: 'Thèm quá, nhìn đĩa đồ ăn ở LA chất lượng thực sự! Video tuyệt vời anh ơi.',
    timestamp: '12/07/2026, 02:40:12 PM',
    likes: 56
  }
];

// Translations dictionary
const TRANSLATIONS = {
  vi: {
    heroTitle: "Hệ Thống Kênh YouTube Của AnHy",
    heroSub: "Đơn vị sáng tạo nội dung hàng đầu với hơn 2.47 triệu người đăng ký trên các lĩnh vực Công nghệ, Đời sống và Tài chính.",
    activeVideo: "Video Đang Phát",
    noVideos: "Không có video nào trong danh mục này.",
    commentsTitle: "Bình luận Cộng đồng",
    writeComment: "Viết bình luận của bạn...",
    sendComment: "Gửi",
    loginToComment: "Đăng nhập để tham gia bình luận",
    bookSponsor: "Đặt lịch hợp tác / Tài trợ",
    bookingSuccessMsg: "Cảm ơn bạn! Thông tin hợp tác đã được gửi đến ban quản trị AnHy Network.",
    adminDashboard: "Bảng Điều Khiển Admin",
    channelsTitle: "Hệ Thống Kênh YouTube",
    subscribers: "Người đăng ký",
    views: "Lượt xem",
    growth: "Tăng trưởng",
    subscribeBtn: "Đăng ký ngay",
    viewChannel: "Xem kênh",
    aboutTitle: "Về AnHy Network",
    aboutDesc: "Chúng tôi xây dựng các nội dung số tiêu chuẩn cao, đem đến kiến thức thực tiễn và trải nghiệm độc đáo cho thế hệ trẻ toàn cầu.",
    liveStats: "Thống Kê Trực Tuyến",
    totalSubs: "Tổng Người Theo Dõi",
    totalViews: "Tổng Lượt Xem",
    activeSince: "Hoạt Động Từ",
    weekendClass: "LỚP HỌC ĐẶC BIỆT CUỐI TUẦN",
    registerNow: "Đăng ký nhận tài liệu",
    close: "Đóng",
    loading: "Đang tải dữ liệu...",
    save: "Lưu",
    delete: "Xóa",
    edit: "Sửa",
    addChannel: "Thêm kênh",
    addVideo: "Thêm Video",
    manageUsers: "Quản lý thành viên",
    manageBookings: "Danh sách yêu cầu tài trợ",
    authTitle: "Xác thực Hệ thống",
    authSub: "Đăng nhập hoặc đăng ký tài khoản để viết bình luận và quản trị.",
    role: "Vai trò",
    admin: "Quản trị viên",
    editor: "Biên tập viên",
    viewer: "Khách xem",
    shareBtn: "Chia sẻ",
    shareTitle: "Chia sẻ Video",
    copyLink: "Sao chép",
    linkCopied: "Đã sao chép!",
    likeBtn: "Thích",
    dislikeBtn: "Không thích",
    miniPlayerBtn: "Trình phát nhỏ",
    restoreBtn: "Khôi phục",
    playingInMini: "Video đang phát ở chế độ thu nhỏ",
    
    // Dynamic alerts & prompts
    likesRatioLabel: "đồng thuận",
    noVideosFound: "Không tìm thấy video phù hợp",
    firstComment: "Hãy là người đầu tiên chia sẻ suy nghĩ của bạn về video này!",
    viewsCountLabel: "lượt xem",
    copied: "Đã sao chép liên kết vào bộ nhớ tạm!",
    fillAuth: "Hãy điền đủ email và mật khẩu!",
    signupSuccess: "Tạo tài khoản thành công!",
    signinSuccess: "Đăng nhập thành công!",
    signoutSuccess: "Đã đăng xuất!",
    authError: "Đã xảy ra lỗi khi xác thực!",
    commentEmpty: "Nội dung bình luận không được để trống!",
    commentPostSuccess: "Đã gửi bình luận!",
    bookingSuccess: "Đã gửi thông tin đăng ký thành công!",
    bookingError: "Đã xảy ra lỗi khi đăng ký!",
    dislikeSuccess: "Đã không thích video!",
    likeSuccess: "Đã thích video!",
    addChannelSuccess: "Đã thêm kênh mới thành công!",
    updateChannelSuccess: "Đã cập nhật kênh thành công!",
    deleteChannelSuccess: "Đã xóa kênh!",
    addVideoSuccess: "Đã thêm video mới!",
    updateVideoSuccess: "Đã cập nhật video thành công!",
    deleteVideoSuccess: "Đã xóa video!",
    deleteBookingSuccess: "Đã xóa yêu cầu!",
    deleteCommentSuccess: "Đã xóa bình luận!",
    resetDbConfirm: "Bạn có chắc chắn muốn khôi phục dữ liệu gốc?",
    resetDbSuccess: "Đã khôi phục cơ sở dữ liệu!",
    deleteVideoConfirm: "Xác nhận xóa video này?",
    deleteChannelConfirm: "Xóa kênh sẽ ẩn tất cả video tương ứng. Tiếp tục?",
    permissionDenied: "Không có quyền thực hiện!",
    updateRoleSuccess: "Cập nhật quyền thành công!",
    deleteUserConfirm: "Xác nhận xóa tài khoản người dùng?",
    deleteUserSuccess: "Đã xóa tài khoản!",
    saveConfigSuccess: "Đã lưu cấu hình!",
    onlyAdminDelete: "Chỉ Quản trị viên mới được xóa!",
    liveBadge: "TRỰC TIẾP",
    setLiveStream: "Đang phát Trực tiếp (Live Stream)",
    liveBroadcasting: "Kênh đang phát trực tiếp",
    videoSaveSuccess: "Đã lưu video thành công!"
  },
  en: {
    heroTitle: "AnHy YouTube Ecosystem",
    heroSub: "Leading digital creator network with 2.47M+ subscribers spanning Technology, Lifestyle, and Wealth Finance.",
    activeVideo: "Active Video Player",
    noVideos: "No videos found in this category.",
    commentsTitle: "Community Feedback",
    writeComment: "Write a public comment...",
    sendComment: "Post",
    loginToComment: "Sign in to join the conversation",
    bookSponsor: "Book Sponsor / Collaboration",
    bookingSuccessMsg: "Thank you! Your proposal has been received by AnHy Network admin.",
    adminDashboard: "Admin Control Console",
    channelsTitle: "Our YouTube Channels",
    subscribers: "Subscribers",
    views: "Total Views",
    growth: "Growth Rate",
    subscribeBtn: "Subscribe",
    viewChannel: "Visit Channel",
    aboutTitle: "About AnHy Network",
    aboutDesc: "We build high-standard digital content delivering practical knowledge and immersive experiences for the global youth.",
    liveStats: "Network Diagnostics",
    totalSubs: "Global Reach",
    totalViews: "Video Impressions",
    activeSince: "Launched",
    weekendClass: "WEEKEND MASTERCLASS",
    registerNow: "Request Syllabus",
    close: "Close",
    loading: "Synchronizing...",
    save: "Save",
    delete: "Delete",
    edit: "Edit",
    addChannel: "Create Channel",
    addVideo: "Publish Video",
    manageUsers: "Member Accounts",
    manageBookings: "Sponsorship Proposals",
    authTitle: "Access Management",
    authSub: "Sign in or sign up to comment and access workspace admin panels.",
    role: "Role",
    admin: "Administrator",
    editor: "Editor",
    viewer: "Viewer",
    shareBtn: "Share",
    shareTitle: "Share Video",
    copyLink: "Copy",
    linkCopied: "Copied!",
    likeBtn: "Like",
    dislikeBtn: "Dislike",
    miniPlayerBtn: "Mini-Player",
    restoreBtn: "Restore",
    playingInMini: "Video is playing in mini-player mode",
    
    // Dynamic alerts & prompts
    likesRatioLabel: "likes",
    noVideosFound: "No matching videos found",
    firstComment: "Be the first to share your thoughts on this video!",
    viewsCountLabel: "views",
    copied: "Link copied to clipboard!",
    fillAuth: "Please fill all email and password fields!",
    signupSuccess: "Sign up successful!",
    signinSuccess: "Signed in successfully!",
    signoutSuccess: "Signed out successfully!",
    authError: "Authentication error occurred!",
    commentEmpty: "Comment content cannot be empty!",
    commentPostSuccess: "Comment posted!",
    bookingSuccess: "Sponsor request submitted successfully!",
    bookingError: "An error occurred during submission!",
    dislikeSuccess: "Disliked video!",
    likeSuccess: "Liked video!",
    addChannelSuccess: "Added new channel successfully!",
    updateChannelSuccess: "Updated channel successfully!",
    deleteChannelSuccess: "Deleted channel successfully!",
    addVideoSuccess: "Published new video successfully!",
    updateVideoSuccess: "Updated video successfully!",
    deleteVideoSuccess: "Deleted video successfully!",
    deleteBookingSuccess: "Deleted sponsor proposal!",
    deleteCommentSuccess: "Deleted comment successfully!",
    resetDbConfirm: "Are you sure you want to restore original default assets?",
    resetDbSuccess: "Database reset to factory configurations!",
    deleteVideoConfirm: "Confirm delete video?",
    deleteChannelConfirm: "Confirm delete channel and related videos?",
    permissionDenied: "Permission denied!",
    updateRoleSuccess: "Updated role successfully!",
    deleteUserConfirm: "Confirm delete user profile?",
    deleteUserSuccess: "Deleted user!",
    saveConfigSuccess: "Saved configurations!",
    onlyAdminDelete: "Only Administrators can delete!",
    liveBadge: "LIVE",
    setLiveStream: "Live Broadcasting (Live Stream)",
    liveBroadcasting: "Channel is broadcasting live",
    videoSaveSuccess: "Video saved successfully!"
  },
  pt: {
    heroTitle: "Ecossistema do YouTube da AnHy",
    heroSub: "Rede líder de criadores digitais com mais de 2.47M de inscritos abrangendo Tecnologia, Estilo de Vida e Finanças.",
    activeVideo: "Vídeo Ativo",
    noVideos: "Nenhum vídeo encontrado nesta categoria.",
    commentsTitle: "Comentários da Comunidade",
    writeComment: "Escreva um comentário público...",
    sendComment: "Postar",
    loginToComment: "Faça login para participar da conversa",
    bookSponsor: "Patrocínio / Colaboração",
    bookingSuccessMsg: "Obrigado! Sua proposta foi recebida pelo administrador da AnHy Network.",
    adminDashboard: "Painel de Controle do Administrador",
    channelsTitle: "Nossos Canais do YouTube",
    subscribers: "Inscritos",
    views: "Visualizações",
    growth: "Taxa de Crescimento",
    subscribeBtn: "Inscrever-se",
    viewChannel: "Visitar Canal",
    aboutTitle: "Sobre a AnHy Network",
    aboutDesc: "Criamos conteúdo digital de alto padrão, oferecendo conhecimento prático e experiências imersivas para jovens de todo o mundo.",
    liveStats: "Diagnóstico de Rede",
    totalSubs: "Alcance Global",
    totalViews: "Impressões de Vídeo",
    activeSince: "Lançado em",
    weekendClass: "MASTERCLASS DE FIM DE SEMANA",
    registerNow: "Solicitar Programa",
    close: "Fechar",
    loading: "Sincronizando...",
    save: "Salvar",
    delete: "Excluir",
    edit: "Editar",
    addChannel: "Criar Canal",
    addVideo: "Publicar Vídeo",
    manageUsers: "Contas de Membros",
    manageBookings: "Propostas de Patrocínio",
    authTitle: "Gerenciamento de Acesso",
    authSub: "Faça login ou cadastre-se para comentar e acessar os painéis de administração.",
    role: "Função",
    admin: "Administrador",
    editor: "Editor",
    viewer: "Visualizador",
    shareBtn: "Compartilhar",
    shareTitle: "Compartilhar Vídeo",
    copyLink: "Copiar",
    linkCopied: "Copiado!",
    likeBtn: "Gostei",
    dislikeBtn: "Não gostei",
    miniPlayerBtn: "Mini-player",
    restoreBtn: "Restaurar",
    playingInMini: "O vídeo está sendo reproduzido no modo mini-player",
    
    // Dynamic alerts & prompts
    likesRatioLabel: "likes",
    noVideosFound: "Nenhum vídeo correspondente encontrado",
    firstComment: "Seja o primeiro a compartilhar seus pensamentos sobre este vídeo!",
    viewsCountLabel: "visualizações",
    copied: "Link copiado para a área de transferência!",
    fillAuth: "Por favor, preencha todos os campos de e-mail e senha!",
    signupSuccess: "Cadastro realizado com sucesso!",
    signinSuccess: "Login realizado com sucesso!",
    signoutSuccess: "Desconectado com sucesso!",
    authError: "Ocorreu um erro de autenticação!",
    commentEmpty: "O conteúdo do comentário não pode estar vazio!",
    commentPostSuccess: "Comentário postado!",
    bookingSuccess: "Solicitação de patrocínio enviada com sucesso!",
    bookingError: "Ocorreu um erro durante o envio!",
    dislikeSuccess: "Vídeo não gostado!",
    likeSuccess: "Vídeo gostado!",
    addChannelSuccess: "Novo canal adicionado com sucesso!",
    updateChannelSuccess: "Canal atualizado com sucesso!",
    deleteChannelSuccess: "Canal excluído com sucesso!",
    addVideoSuccess: "Novo vídeo publicado com sucesso!",
    updateVideoSuccess: "Vídeo atualizado com sucesso!",
    deleteVideoSuccess: "Vídeo excluído com sucesso!",
    deleteBookingSuccess: "Proposta de patrocínio excluída!",
    deleteCommentSuccess: "Comentário excluído com sucesso!",
    resetDbConfirm: "Tem certeza de que deseja restaurar as configurações originais de fábrica?",
    resetDbSuccess: "Banco de dados redefinido para as configurações de fábrica!",
    deleteVideoConfirm: "Confirmar exclusão do vídeo?",
    deleteChannelConfirm: "Confirmar a exclusão do canal e dos vídeos relacionados?",
    permissionDenied: "Permissão negada!",
    updateRoleSuccess: "Função atualizada com sucesso!",
    deleteUserConfirm: "Confirmar exclusão do perfil do usuário?",
    deleteUserSuccess: "Usuário excluído!",
    saveConfigSuccess: "Configurações salvas!",
    onlyAdminDelete: "Apenas administradores podem excluir!",
    liveBadge: "AO VIVO",
    setLiveStream: "Transmissão ao vivo (Live Stream)",
    liveBroadcasting: "Canal está transmitindo ao vivo",
    videoSaveSuccess: "Vídeo salvo com sucesso!"
  },
  ko: {
    heroTitle: "AnHy 유튜브 생태계",
    heroSub: "기술, 라이프스타일, 금융 분야에서 247만 명 이상의 구독자를 보유한 선도적인 디지털 크리에이터 네트워크.",
    activeVideo: "재생 중인 비디오",
    noVideos: "이 카테고리에 비디오가 없습니다.",
    commentsTitle: "커뮤니티 피드백",
    writeComment: "공개 댓글 쓰기...",
    sendComment: "게시",
    loginToComment: "대화에 참여하려면 로그인하세요",
    bookSponsor: "협업 / 스폰서십 신청",
    bookingSuccessMsg: "감사합니다! 귀하의 제안이 AnHy 네트워크 관리자에게 접수되었습니다.",
    adminDashboard: "관리자 제어 콘솔",
    channelsTitle: "유튜브 채널 목록",
    subscribers: "구독자",
    views: "조회수",
    growth: "성장률",
    subscribeBtn: "구독하기",
    viewChannel: "채널 방문",
    aboutTitle: "AnHy 네트워크 소개",
    aboutDesc: "우리는 전 세계 젊은이들에게 실용적인 지식과 몰입감 넘치는 경험을 제공하는 높은 수준의 디지털 콘텐츠를 제작합니다.",
    liveStats: "네트워크 진단",
    totalSubs: "글로벌 도달 범위",
    totalViews: "동영상 노출수",
    activeSince: "출시일",
    weekendClass: "주말 마스터클래스",
    registerNow: "실러버스 신청",
    close: "닫기",
    loading: "동기화 중...",
    save: "저장",
    delete: "삭제",
    edit: "편집",
    addChannel: "채널 생성",
    addVideo: "동영상 게시",
    manageUsers: "회원 계정",
    manageBookings: "스폰서십 제안 목록",
    authTitle: "액세스 관리",
    authSub: "댓글 작성 및 관리자 패널 접근을 위해 로그인 또는 가입하세요.",
    role: "역할",
    admin: "관리자",
    editor: "편집자",
    viewer: "뷰어",
    shareBtn: "공유",
    shareTitle: "동영상 공유",
    copyLink: "복사",
    linkCopied: "복사됨!",
    likeBtn: "좋아요",
    dislikeBtn: "싫어요",
    miniPlayerBtn: "미니 플레이어",
    restoreBtn: "원래 크기로",
    playingInMini: "동영상이 미니 플레이어 모드에서 재생 중입니다",
    
    // Dynamic alerts & prompts
    likesRatioLabel: "추천",
    noVideosFound: "일치하는 동영상이 없습니다",
    firstComment: "이 동영상에 첫 댓글을 남겨보세요!",
    viewsCountLabel: "조회",
    copied: "클립보드에 링크가 복사되었습니다!",
    fillAuth: "이메일과 비밀번호를 모두 입력해 주세요!",
    signupSuccess: "회원가입이 완료되었습니다!",
    signinSuccess: "로그인에 성공했습니다!",
    signoutSuccess: "로그아웃되었습니다!",
    authError: "인증 중 오류가 발생했습니다!",
    commentEmpty: "댓글 내용을 입력해 주세요!",
    commentPostSuccess: "댓글이 등록되었습니다!",
    bookingSuccess: "스폰서십 신청이 성공적으로 접수되었습니다!",
    bookingError: "접수 중 오류가 발생했습니다!",
    dislikeSuccess: "이 동영상을 싫어합니다!",
    likeSuccess: "이 동영상을 좋아합니다!",
    addChannelSuccess: "새 채널이 추가되었습니다!",
    updateChannelSuccess: "채널이 업데이트되었습니다!",
    deleteChannelSuccess: "채널이 삭제되었습니다!",
    addVideoSuccess: "새 동영상이 게시되었습니다!",
    updateVideoSuccess: "동영상이 업데이트되었습니다!",
    deleteVideoSuccess: "동영상이 삭제되었습니다!",
    deleteBookingSuccess: "제안서가 삭제되었습니다!",
    deleteCommentSuccess: "댓글이 삭제되었습니다!",
    resetDbConfirm: "데이터베이스를 초기 설정으로 복원하시겠습니까?",
    resetDbSuccess: "데이터베이스가 초기 설정으로 복원되었습니다!",
    deleteVideoConfirm: "이 동영상을 삭제하시겠습니까?",
    deleteChannelConfirm: "채널 및 관련 동영상을 삭제하시겠습니까?",
    permissionDenied: "권한이 거부되었습니다!",
    updateRoleSuccess: "역할이 성공적으로 업데이트되었습니다!",
    deleteUserConfirm: "사용자 프로필 삭제를 확인하시겠습니까?",
    deleteUserSuccess: "사용자가 삭제되었습니다!",
    saveConfigSuccess: "설정이 저장되었습니다!",
    onlyAdminDelete: "관리자만 삭제할 수 있습니다!",
    liveBadge: "라이브",
    setLiveStream: "라이브 스트리밍 (Live Stream)",
    liveBroadcasting: "채널이 현재 라이브 방송 중입니다",
    videoSaveSuccess: "동영상이 성공적으로 저장되었습니다!"
  },
  ja: {
    heroTitle: "AnHy YouTube エコシステム",
    heroSub: "テクノロジー、ライフスタイル、金融にわたり247万人以上のチャンネル登録者を誇る、大手のデジタルクリエイターネットワーク。",
    activeVideo: "再生中の動画",
    noVideos: "このカテゴリに動画が見つかりませんでした。",
    commentsTitle: "コミュニティのフィードバック",
    writeComment: "公開コメントを入力...",
    sendComment: "投稿",
    loginToComment: "会話に参加するにはログインしてください",
    bookSponsor: "コラボ・スポンサーシップの申し込み",
    bookingSuccessMsg: "ありがとうございます！提案はAnHyネットワーク管理者に送信されました。",
    adminDashboard: "管理者コントロールコンソール",
    channelsTitle: "Our YouTube Channels",
    subscribers: "登録者",
    views: "視聴回数",
    growth: "成長率",
    subscribeBtn: "チャンネル登録",
    viewChannel: "チャンネルを見る",
    aboutTitle: "AnHy Networkについて",
    aboutDesc: "私たちは、世界の若者に向けて、実用的な知識と没入感のある体験を提供する、高水準のデジタルコンテンツを構築しています。",
    liveStats: "ネットワーク診断",
    totalSubs: "グローバルリーチ",
    totalViews: "動画インプレッション",
    activeSince: "開設日",
    weekendClass: "週末マスタークラス",
    registerNow: "シラバスを請求",
    close: "閉じる",
    loading: "同期中...",
    save: "保存",
    delete: "削除",
    edit: "編集",
    addChannel: "チャンネル作成",
    addVideo: "動画公開",
    manageUsers: "メンバーアカウント",
    manageBookings: "スポンサーシップ提案",
    authTitle: "アクセス管理",
    authSub: "コメントの投稿や管理者パネルにアクセスするには、サインインまたは新規登録してください。",
    role: "役割",
    admin: "管理者",
    editor: "編集者",
    viewer: "ビューアー",
    shareBtn: "共有",
    shareTitle: "動画を共有",
    copyLink: "コピー",
    linkCopied: "コピーしました！",
    likeBtn: "高評価",
    dislikeBtn: "低評価",
    miniPlayerBtn: "ミニプレーヤー",
    restoreBtn: "元に戻す",
    playingInMini: "動画はミニプレーヤーモードで再生されています",
    
    // Dynamic alerts & prompts
    likesRatioLabel: "高評価",
    noVideosFound: "一致する動画が見つかりませんでした",
    firstComment: "この動画に最初のコメントを残しましょう！",
    viewsCountLabel: "回視聴",
    copied: "リンクをクリップボードにコピーしました！",
    fillAuth: "メールアドレスとパスワードを両方入力してください！",
    signupSuccess: "新規登録に成功しました！",
    signinSuccess: "ログインに成功しました！",
    signoutSuccess: "ログアウトしました！",
    authError: "認証エラーが発生しました！",
    commentEmpty: "コメント内容を入力してください！",
    commentPostSuccess: "コメントを投稿しました！",
    bookingSuccess: "スポンサーシップの申し込みが送信されました！",
    bookingError: "送信中にエラーが発生しました！",
    dislikeSuccess: "動画を低評価しました！",
    likeSuccess: "動画を高評価しました！",
    addChannelSuccess: "新しいチャンネルが追加されました！",
    updateChannelSuccess: "チャンネルが更新されました！",
    deleteChannelSuccess: "チャンネルが削除されました！",
    addVideoSuccess: "新しい動画が公開されました！",
    updateVideoSuccess: "動画が更新されました！",
    deleteVideoSuccess: "動画が削除されました！",
    deleteBookingSuccess: "提案が削除されました！",
    deleteCommentSuccess: "コメントが削除されました！",
    resetDbConfirm: "本当に初期データベースに復元しますか？",
    resetDbSuccess: "データベースが工場出荷時状態にリセットされました！",
    deleteVideoConfirm: "この動画を削除しますか？",
    deleteChannelConfirm: "チャンネルと関連する動画を削除しますか？",
    permissionDenied: "アクセス権限がありません！",
    updateRoleSuccess: "役割が更新されました！",
    deleteUserConfirm: "ユーザープロファイルを削除しますか？",
    deleteUserSuccess: "ユーザーが削除されました！",
    saveConfigSuccess: "設定が保存されました！",
    onlyAdminDelete: "管理者のみ削除できます！",
    liveBadge: "ライブ",
    setLiveStream: "ライブ配信 (Live Stream)",
    liveBroadcasting: "チャンネルは現在ライブ配信中です",
    videoSaveSuccess: "動画が正常に保存されました！"
  }
};

const parseCount = (val: string | undefined | null): number => {
  if (!val) return 0;
  const str = val.toString().trim().toUpperCase();
  const match = str.match(/([\d.,]+)\s*(.*)/);
  if (!match) return 0;
  
  const numStr = match[1].replace(/,/g, '');
  const num = parseFloat(numStr);
  if (isNaN(num)) return 0;
  
  const unit = match[2].trim();
  if (!unit) return num;

  if (unit === 'K' || unit === 'N' || unit.startsWith('NG')) {
    return num * 1000;
  }
  if (unit === 'M' || unit.startsWith('TR')) {
    return num * 1000000;
  }
  if (unit === 'T' || unit.startsWith('TỶ') || unit.startsWith('TY') || unit === 'B') {
    return num * 1000000000;
  }
  return num;
};

const formatCount = (num: number): string => {
  if (num >= 1000000000) {
    return (num / 1000000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + 'B';
  }
  if (num >= 1000000) {
    return (num / 1000000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(2).replace(/\.00$/, '').replace(/(\.\d)0$/, '$1') + 'K';
  }
  return num.toString();
};

export default function App() {
  const [language, setLanguage] = useState<'vi' | 'en' | 'pt' | 'ko' | 'ja'>('vi');
  const [user, setUser] = useState<any>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [userRole, setUserRole] = useState<'admin' | 'editor' | 'viewer'>('viewer');
  const [isMiniPlayer, setIsMiniPlayer] = useState(false);
  
  // Collections states
  const [channels, setChannels] = useState<Channel[]>([]);
  const [videos, setVideos] = useState<VideoClip[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [allUsersList, setAllUsersList] = useState<UserProfile[]>([]);
  
  // Interactive Filters
  const [activeChannelId, setActiveChannelId] = useState<string>('all');
  const [activeVideoId, setActiveVideoId] = useState<string>(() => {
    const params = new URLSearchParams(window.location.search);
    return params.get('v') || 'vid-1';
  });
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Sidebar sorting and pagination
  const [sidebarSortBy, setSidebarSortBy] = useState<'newest' | 'oldest' | 'views' | 'likes'>('newest');
  const [sidebarPage, setSidebarPage] = useState(1);
  const sidebarPageSize = 8;

  // Administrative Control Panel Tab & Workspace States
  const [adminActiveTab, setAdminActiveTab] = useState<'configs' | 'channels' | 'videos'>('configs');
  const [adminVideoSearch, setAdminVideoSearch] = useState('');
  const [adminVideoChannelFilter, setAdminVideoChannelFilter] = useState('all');
  const [adminVideoSortBy, setAdminVideoSortBy] = useState<'newest' | 'oldest' | 'views' | 'likes'>('newest');
  const [adminVideoPage, setAdminVideoPage] = useState(1);
  const adminVideoPageSize = 10;

  // Modals
  const [isShareOpen, setIsShareOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isBookingOpen, setIsBookingOpen] = useState(false);
  const [isAdminOpen, setIsAdminOpen] = useState(false);
  const [isAuthOpen, setIsAuthOpen] = useState(false);
  const [isAddChannelOpen, setIsAddChannelOpen] = useState(false);
  const [isAddVideoOpen, setIsAddVideoOpen] = useState(false);

  // Forms
  const [authEmail, setAuthEmail] = useState('');
  const [authPassword, setAuthPassword] = useState('');
  const [authName, setAuthName] = useState('');
  const [isSignUpMode, setIsSignUpMode] = useState(false);

  const [bookingForm, setBookingForm] = useState({
    fullName: '',
    email: '',
    companyName: '',
    purpose: '',
    message: ''
  });
  const [bookingSuccess, setBookingSuccess] = useState(false);

  const [commentText, setCommentText] = useState('');

  // Configuration settings for masterclass managed by Admin
  const [masterclassTitleVi, setMasterclassTitleVi] = useState('');
  const [masterclassSubVi, setMasterclassSubVi] = useState('');
  const [masterclassTitleEn, setMasterclassTitleEn] = useState('');
  const [masterclassSubEn, setMasterclassSubEn] = useState('');

  // Add/Edit channel forms
  const [editingChannel, setEditingChannel] = useState<Partial<Channel> | null>(null);
  const [editingVideo, setEditingVideo] = useState<Partial<VideoClip> | null>(null);

  // Simple toast system
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' | 'info' } | null>(null);
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // Auth monitoring & syncing
  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        // Sync user role and profile
        const userDocRef = doc(db, 'users', currentUser.uid);
        const unsubProfile = onSnapshot(userDocRef, async (snap) => {
          if (snap.exists()) {
            const data = snap.data() as UserProfile;
            setUserProfile(data);
            setUserRole(data.role);
          } else {
            // Is it the first registered user? Assign admin. Otherwise viewer.
            const initialRole = (currentUser.email === 'hoangnamkz1992@gmail.com' || currentUser.email === 'haihoang1992ky@gmail.com') ? 'admin' : 'viewer';
            const newProfile: UserProfile = {
              uid: currentUser.uid,
              email: currentUser.email || '',
              displayName: currentUser.displayName || authName || currentUser.email?.split('@')[0] || 'User',
              role: initialRole,
              createdAt: new Date().toISOString()
            };
            try {
              await setDoc(userDocRef, newProfile);
              setUserProfile(newProfile);
              setUserRole(initialRole);
            } catch (err) {
              handleFirestoreError(err, OperationType.WRITE, `users/${currentUser.uid}`);
            }
          }
        }, (error) => {
          handleFirestoreError(error, OperationType.GET, `users/${currentUser.uid}`);
        });
        return () => unsubProfile();
      } else {
        setUserProfile(null);
        setUserRole('viewer');
      }
    });
    return () => unsubAuth();
  }, [authName]);

  // Read list of all users for Admin
  useEffect(() => {
    if (userRole !== 'admin') return;
    const unsubUsers = onSnapshot(collection(db, 'users'), (snapshot) => {
      const list: UserProfile[] = [];
      snapshot.forEach((docSnap) => {
        list.push(docSnap.data() as UserProfile);
      });
      list.sort((a, b) => (a.email || '').localeCompare(b.email || ''));
      setAllUsersList(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'users');
    });
    return () => unsubUsers();
  }, [userRole]);

  // Real-time Collections Synchronization & Initial Seeding
  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'channels'), (snapshot) => {
      if (snapshot.empty) {
        // Seed default database template
        DEFAULT_CHANNELS.forEach((ch) => {
          try {
            setDoc(doc(db, 'channels', ch.id), ch);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `channels/${ch.id}`);
          }
        });
      } else {
        const list: Channel[] = [];
        snapshot.forEach((d) => list.push(d.data() as Channel));
        setChannels(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'channels');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'videos'), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_VIDEOS.forEach((vid) => {
          try {
            setDoc(doc(db, 'videos', vid.id), vid);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `videos/${vid.id}`);
          }
        });
      } else {
        const list: VideoClip[] = [];
        snapshot.forEach((d) => list.push(d.data() as VideoClip));
        setVideos(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'videos');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'comments'), (snapshot) => {
      if (snapshot.empty) {
        DEFAULT_COMMENTS.forEach((c) => {
          try {
            setDoc(doc(db, 'comments', c.id), c);
          } catch (err) {
            handleFirestoreError(err, OperationType.WRITE, `comments/${c.id}`);
          }
        });
      } else {
        const list: Comment[] = [];
        snapshot.forEach((d) => list.push(d.data() as Comment));
        setComments(list);
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'comments');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'bookings'), (snapshot) => {
      const list: Booking[] = [];
      snapshot.forEach((d) => list.push(d.data() as Booking));
      list.sort((a, b) => b.id.localeCompare(a.id));
      setBookings(list);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'bookings');
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    const unsub = onSnapshot(doc(db, 'config', 'global'), (snap) => {
      if (snap.exists()) {
        const data = snap.data();
        setMasterclassTitleVi(data.masterclassTitleVi || '');
        setMasterclassSubVi(data.masterclassSubVi || '');
        setMasterclassTitleEn(data.masterclassTitleEn || '');
        setMasterclassSubEn(data.masterclassSubEn || '');
      } else {
        try {
          setDoc(doc(db, 'config', 'global'), {
            masterclassTitleVi: '',
            masterclassSubVi: '',
            masterclassTitleEn: '',
            masterclassSubEn: ''
          });
        } catch (err) {
          handleFirestoreError(err, OperationType.WRITE, 'config/global');
        }
      }
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, 'config/global');
    });
    return () => unsub();
  }, []);

  // Filtered and Active Assets memoization
  const filteredVideos = useMemo(() => {
    let result = [...videos];
    
    // Hide videos of hidden channels if not admin/editor
    if (userRole !== 'admin' && userRole !== 'editor') {
      const hiddenIds = channels.filter(c => c.isHidden).map(c => c.id);
      result = result.filter(v => !hiddenIds.includes(v.channelId));
    }

    if (activeChannelId !== 'all') {
      result = result.filter(v => v.channelId === activeChannelId);
    }
    if (searchQuery.trim() !== '') {
      const q = searchQuery.toLowerCase().trim();
      result = result.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q)
      );
    }

    // Apply sorting
    if (sidebarSortBy === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (sidebarSortBy === 'oldest') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    } else if (sidebarSortBy === 'views') {
      const parseViews = (vStr: string) => {
        if (!vStr) return 0;
        const cleaned = vStr.toLowerCase().replace(/[^0-9.km]/g, '');
        if (cleaned.includes('m')) return parseFloat(cleaned) * 1000000;
        if (cleaned.includes('k')) return parseFloat(cleaned) * 1000;
        return parseFloat(cleaned) || 0;
      };
      result.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    } else if (sidebarSortBy === 'likes') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }

    return result;
  }, [videos, channels, activeChannelId, searchQuery, sidebarSortBy, userRole]);

  // Sidebar pagination effect
  useEffect(() => {
    setSidebarPage(1);
  }, [activeChannelId, searchQuery, sidebarSortBy]);

  const paginatedSidebarVideos = useMemo(() => {
    const start = (sidebarPage - 1) * sidebarPageSize;
    return filteredVideos.slice(start, start + sidebarPageSize);
  }, [filteredVideos, sidebarPage, sidebarPageSize]);

  const totalSidebarPages = Math.ceil(filteredVideos.length / sidebarPageSize) || 1;

  const visibleChannels = useMemo(() => {
    return channels.filter(ch => !ch.isHidden || (userRole === 'admin' || userRole === 'editor'));
  }, [channels, userRole]);

  const dynamicStats = useMemo(() => {
    let totalSubs = 0;
    let totalViews = 0;
    const years: number[] = [];
    
    channels.forEach(ch => {
      // Sum only visible (or non-hidden) channels, or all? Let's sum all channels in user's ecosystem
      totalSubs += parseCount(ch.subscribers);
      totalViews += parseCount(ch.views);
      
      if (ch.joinedYear) {
        const y = parseInt(ch.joinedYear);
        if (!isNaN(y)) years.push(y);
      } else {
        if (ch.id === 'v-tech') years.push(2023);
        else if (ch.id === 'v-life') years.push(2024);
        else if (ch.id === 'v-finance') years.push(2025);
      }
    });

    const minYear = years.length > 0 ? Math.min(...years) : 2023;
    const currentYear = new Date().getFullYear();
    const activeSinceStr = `${minYear} - ${currentYear}`;

    return {
      subscribers: formatCount(totalSubs),
      views: formatCount(totalViews),
      activeSince: activeSinceStr
    };
  }, [channels]);

  // Admin Video Workspace memoized states
  const filteredAdminVideos = useMemo(() => {
    let result = [...videos];
    if (adminVideoChannelFilter !== 'all') {
      result = result.filter(v => v.channelId === adminVideoChannelFilter);
    }
    if (adminVideoSearch.trim() !== '') {
      const q = adminVideoSearch.toLowerCase().trim();
      result = result.filter(v => 
        v.title.toLowerCase().includes(q) || 
        v.description.toLowerCase().includes(q)
      );
    }
    if (adminVideoSortBy === 'newest') {
      result.sort((a, b) => b.id.localeCompare(a.id));
    } else if (adminVideoSortBy === 'oldest') {
      result.sort((a, b) => a.id.localeCompare(b.id));
    } else if (adminVideoSortBy === 'views') {
      const parseViews = (vStr: string) => {
        if (!vStr) return 0;
        const cleaned = vStr.toLowerCase().replace(/[^0-9.km]/g, '');
        if (cleaned.includes('m')) return parseFloat(cleaned) * 1000000;
        if (cleaned.includes('k')) return parseFloat(cleaned) * 1000;
        return parseFloat(cleaned) || 0;
      };
      result.sort((a, b) => parseViews(b.views) - parseViews(a.views));
    } else if (adminVideoSortBy === 'likes') {
      result.sort((a, b) => (b.likes || 0) - (a.likes || 0));
    }
    return result;
  }, [videos, adminVideoChannelFilter, adminVideoSearch, adminVideoSortBy]);

  useEffect(() => {
    setAdminVideoPage(1);
  }, [adminVideoChannelFilter, adminVideoSearch, adminVideoSortBy]);

  const paginatedAdminVideos = useMemo(() => {
    const start = (adminVideoPage - 1) * adminVideoPageSize;
    return filteredAdminVideos.slice(start, start + adminVideoPageSize);
  }, [filteredAdminVideos, adminVideoPage, adminVideoPageSize]);

  const totalAdminVideoPages = Math.ceil(filteredAdminVideos.length / adminVideoPageSize) || 1;

  const activeVideo = useMemo(() => {
    const active = filteredVideos.find(v => v.id === activeVideoId);
    if (active) return active;
    if (filteredVideos.length > 0) return filteredVideos[0];
    return videos[0] || null;
  }, [videos, filteredVideos, activeVideoId]);

  const activeComments = useMemo(() => {
    if (!activeVideo) return [];
    return comments.filter(c => c.videoId === activeVideo.id);
  }, [comments, activeVideo]);

  // Synchronize URL query parameter 'v' with browser history
  useEffect(() => {
    if (activeVideoId) {
      const url = new URL(window.location.href);
      url.searchParams.set('v', activeVideoId);
      window.history.replaceState(null, '', url.toString());
    }
  }, [activeVideoId]);

  // Handle browser back/forward buttons (e.g. popstate events)
  useEffect(() => {
    const handlePopState = () => {
      const params = new URLSearchParams(window.location.search);
      const videoParam = params.get('v');
      if (videoParam) {
        setActiveVideoId(videoParam);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const getShareUrl = (videoId: string) => {
    let origin = window.location.origin;
    if (origin.includes('localhost') || origin.includes('127.0.0.1') || origin.includes('::1')) {
      origin = 'https://ais-dev-yoshrezulybjpelboqtj6v-381733775562.asia-east1.run.app';
    }
    
    let pathname = window.location.pathname;
    if (pathname.endsWith('/index.html')) {
      pathname = pathname.substring(0, pathname.length - 10);
    }
    if (!pathname.endsWith('/')) {
      pathname += '/';
    }
    
    const url = new URL(origin + pathname);
    url.searchParams.set('v', videoId);
    return url.toString();
  };

  const handleCopyLink = (videoId: string) => {
    const url = getShareUrl(videoId);
    
    const fallbackCopy = (text: string) => {
      const textArea = document.createElement("textarea");
      textArea.value = text;
      textArea.style.top = "0";
      textArea.style.left = "0";
      textArea.style.position = "fixed";
      document.body.appendChild(textArea);
      textArea.focus();
      textArea.select();
      try {
        document.execCommand('copy');
        setCopied(true);
        showToast(TRANSLATIONS[language].copied, 'success');
        setTimeout(() => setCopied(false), 2000);
      } catch (err) {
        console.error('Fallback copy failed', err);
        showToast('Failed to copy', 'error');
      }
      document.body.removeChild(textArea);
    };

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(url)
        .then(() => {
          setCopied(true);
          showToast(TRANSLATIONS[language].copied, 'success');
          setTimeout(() => setCopied(false), 2000);
        })
        .catch(() => {
          fallbackCopy(url);
        });
    } else {
      fallbackCopy(url);
    }
  };

  // Auth Operations
  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!authEmail || !authPassword) {
      showToast(TRANSLATIONS[language].fillAuth, 'error');
      return;
    }
    try {
      if (isSignUpMode) {
        const userCred = await createUserWithEmailAndPassword(auth, authEmail, authPassword);
        if (authName && userCred.user) {
          await updateProfile(userCred.user, { displayName: authName });
        }
        showToast(TRANSLATIONS[language].signupSuccess, 'success');
      } else {
        await signInWithEmailAndPassword(auth, authEmail, authPassword);
        showToast(TRANSLATIONS[language].signinSuccess, 'success');
      }
      setIsAuthOpen(false);
      setAuthEmail('');
      setAuthPassword('');
    } catch (err: any) {
      console.error(err);
      showToast(err.message || 'Authentication failed', 'error');
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      showToast(TRANSLATIONS[language].signoutSuccess, 'info');
    } catch (err) {
      console.error(err);
    }
  };

  const handleUpdateUserRole = async (uid: string, nextRole: 'admin' | 'editor' | 'viewer') => {
    if (userRole !== 'admin') {
      showToast(TRANSLATIONS[language].permissionDenied, 'error');
      return;
    }
    try {
      await updateDoc(doc(db, 'users', uid), { role: nextRole });
      showToast(TRANSLATIONS[language].updateRoleSuccess, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${uid}`);
    }
  };

  const handleDeleteUser = async (uid: string) => {
    if (userRole !== 'admin') return;
    if (confirm(TRANSLATIONS[language].deleteUserConfirm)) {
      try {
        await deleteDoc(doc(db, 'users', uid));
        showToast(TRANSLATIONS[language].deleteUserSuccess, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}`);
      }
    }
  };

  // Booking submit
  const handleBookingSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const id = 'bk-' + Date.now();
    const newBooking: Booking = {
      id,
      ...bookingForm,
      timestamp: new Date().toLocaleString()
    };
    try {
      await setDoc(doc(db, 'bookings', id), newBooking);
      setBookingSuccess(true);
      showToast(TRANSLATIONS[language].bookingSuccessMsg, 'success');
      setBookingForm({ fullName: '', email: '', companyName: '', purpose: '', message: '' });
      setTimeout(() => {
        setBookingSuccess(false);
        setIsBookingOpen(false);
      }, 2000);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `bookings/${id}`);
    }
  };

  // Comment submit
  const handleCommentSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    if (!user) {
      setIsAuthOpen(true);
      return;
    }
    const id = 'comm-' + Date.now();
    const newComment: Comment = {
      id,
      videoId: activeVideo?.id || 'vid-1',
      author: user.displayName || user.email?.split('@')[0] || 'Guest',
      text: commentText,
      timestamp: new Date().toLocaleString(),
      likes: 0
    };
    try {
      await setDoc(doc(db, 'comments', id), newComment);
      setCommentText('');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `comments/${id}`);
    }
  };

  // Likes handling
  const handleLikeComment = async (commentId: string) => {
    const comm = comments.find(c => c.id === commentId);
    if (comm) {
      try {
        await updateDoc(doc(db, 'comments', commentId), {
          likes: (comm.likes || 0) + 1
        });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `comments/${commentId}`);
      }
    }
  };

  const handleLikeVideo = async (videoId: string) => {
    const vid = videos.find(v => v.id === videoId);
    if (vid) {
      try {
        await updateDoc(doc(db, 'videos', videoId), {
          likes: (vid.likes || 0) + 1
        });
        showToast(TRANSLATIONS[language].likeSuccess, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
      }
    }
  };

  const handleDislikeVideo = async (videoId: string) => {
    const vid = videos.find(v => v.id === videoId);
    if (vid) {
      try {
        await updateDoc(doc(db, 'videos', videoId), {
          dislikes: (vid.dislikes || 0) + 1
        });
        showToast(TRANSLATIONS[language].dislikeSuccess, 'info');
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
      }
    }
  };

  const handleIncrementViews = async (videoId: string) => {
    const vid = videos.find(v => v.id === videoId);
    if (vid) {
      try {
        const parseViews = (viewsStr: string) => {
          const match = viewsStr.match(/(\d+(\.\d+)?)/);
          return match ? parseFloat(match[1]) : 0;
        };
        const num = parseViews(vid.views);
        const suffix = vid.views.includes('M') ? 'M lượt xem' : vid.views.includes('K') ? 'K lượt xem' : ' lượt xem';
        const updatedViews = (num + 1).toFixed(0) + suffix;
        await updateDoc(doc(db, 'videos', videoId), { views: updatedViews });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `videos/${videoId}`);
      }
    }
  };

  // Settings modification
  const handleSaveMasterclass = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin') return;
    try {
      await setDoc(doc(db, 'config', 'global'), {
        masterclassTitleVi,
        masterclassSubVi,
        masterclassTitleEn,
        masterclassSubEn
      });
      showToast(TRANSLATIONS[language].saveConfigSuccess, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'config/global');
    }
  };

  // Add & Modify Channels
  const handleChannelSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin' && userRole !== 'editor') return;
    const chId = editingChannel?.id || 'ch-' + Date.now();
    const payload: Channel = {
      id: chId,
      name: editingChannel?.name || 'New Channel',
      emoji: editingChannel?.emoji || '📺',
      subscribers: editingChannel?.subscribers || '0',
      views: editingChannel?.views || '0',
      growth: editingChannel?.growth || '+0% this month',
      description: editingChannel?.description || '',
      tag: editingChannel?.tag || 'CONTENT',
      accent: editingChannel?.accent || 'indigo',
      colorClass: editingChannel?.colorClass || 'from-indigo-600 to-indigo-800',
      channelUrl: editingChannel?.channelUrl || '',
      subscribeUrl: editingChannel?.subscribeUrl || '',
      isHidden: editingChannel?.isHidden || false,
      joinedYear: editingChannel?.joinedYear || '2026'
    };
    try {
      await setDoc(doc(db, 'channels', chId), payload);
      setIsAddChannelOpen(false);
      setEditingChannel(null);
      showToast(TRANSLATIONS[language].updateChannelSuccess, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `channels/${chId}`);
    }
  };

  // Add & Modify Videos
  const handleVideoSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (userRole !== 'admin' && userRole !== 'editor') return;
    const vidId = editingVideo?.id || 'vid-' + Date.now();
    const payload: VideoClip = {
      id: vidId,
      channelId: editingVideo?.channelId || 'v-tech',
      title: editingVideo?.title || 'Untitiled video',
      url: editingVideo?.url || '',
      description: editingVideo?.description || '',
      duration: editingVideo?.duration || '10:00',
      quality: editingVideo?.quality || '1080p',
      views: editingVideo?.views || '10 lượt xem',
      likes: editingVideo?.likes || 0,
      dislikes: editingVideo?.dislikes || 0,
      thumbnailGradient: editingVideo?.thumbnailGradient || 'from-slate-950 via-slate-900 to-slate-950',
      isLive: editingVideo?.isLive || false
    };
    try {
      await setDoc(doc(db, 'videos', vidId), payload);
      setIsAddVideoOpen(false);
      setEditingVideo(null);
      showToast(TRANSLATIONS[language].videoSaveSuccess, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, `videos/${vidId}`);
    }
  };

  // Destruction Operations
  const handleDeleteChannel = async (id: string) => {
    if (userRole !== 'admin') {
      showToast(TRANSLATIONS[language].onlyAdminDelete, 'error');
      return;
    }
    if (confirm(TRANSLATIONS[language].deleteChannelConfirm)) {
      try {
        await deleteDoc(doc(db, 'channels', id));
        const relVideos = videos.filter(v => v.channelId === id);
        for (const v of relVideos) {
          await deleteDoc(doc(db, 'videos', v.id));
        }
        if (activeChannelId === id) setActiveChannelId('all');
        showToast(TRANSLATIONS[language].deleteChannelSuccess, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `channels/${id}`);
      }
    }
  };

  const handleDeleteVideo = async (id: string) => {
    if (userRole !== 'admin') return;
    if (confirm(TRANSLATIONS[language].deleteVideoConfirm)) {
      try {
        await deleteDoc(doc(db, 'videos', id));
        if (activeVideoId === id) {
          const rem = videos.filter(v => v.id !== id);
          if (rem.length > 0) setActiveVideoId(rem[0].id);
        }
        showToast(TRANSLATIONS[language].deleteVideoSuccess, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `videos/${id}`);
      }
    }
  };

  const handleDeleteBooking = async (id: string) => {
    if (userRole !== 'admin') return;
    try {
      await deleteDoc(doc(db, 'bookings', id));
      showToast(TRANSLATIONS[language].deleteBookingSuccess, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `bookings/${id}`);
    }
  };

  const handleDeleteComment = async (id: string) => {
    if (userRole !== 'admin' && userRole !== 'editor') return;
    try {
      await deleteDoc(doc(db, 'comments', id));
      showToast(TRANSLATIONS[language].deleteCommentSuccess, 'success');
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `comments/${id}`);
    }
  };

  const handleResetDefaults = async () => {
    if (userRole !== 'admin') return;
    if (confirm(TRANSLATIONS[language].resetDbConfirm)) {
      try {
        for (const ch of channels) await deleteDoc(doc(db, 'channels', ch.id));
        for (const v of videos) await deleteDoc(doc(db, 'videos', v.id));
        for (const c of comments) await deleteDoc(doc(db, 'comments', c.id));
        for (const b of bookings) await deleteDoc(doc(db, 'bookings', b.id));

        for (const ch of DEFAULT_CHANNELS) await setDoc(doc(db, 'channels', ch.id), ch);
        for (const v of DEFAULT_VIDEOS) await setDoc(doc(db, 'videos', v.id), v);
        for (const c of DEFAULT_COMMENTS) await setDoc(doc(db, 'comments', c.id), c);

        await setDoc(doc(db, 'config', 'global'), {
          masterclassTitleVi: '',
          masterclassSubVi: '',
          masterclassTitleEn: '',
          masterclassSubEn: ''
        });

        setActiveChannelId('all');
        setActiveVideoId('vid-1');
        setIsAdminOpen(false);
        showToast(TRANSLATIONS[language].resetDbSuccess, 'success');
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, 'reset-defaults');
      }
    }
  };

  // Extract youtube video ID for embedding
  const youtubeEmbedUrl = useMemo(() => {
    if (!activeVideo) return '';
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|\&v=)([^#\&\?]*).*/;
    const match = activeVideo.url.match(regExp);
    const videoId = (match && match[2].length === 11) ? match[2] : null;
    return videoId ? `https://www.youtube.com/embed/${videoId}?autoplay=0&rel=0` : '';
  }, [activeVideo]);

  return (
    <div id="anhynetwork-root" className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans transition-colors duration-300">
      
      {/* Dynamic Masterclass Weekend Banner */}
      {((language === 'vi' ? masterclassTitleVi : masterclassTitleEn)) && (
        <div id="masterclass-banner" className="bg-gradient-to-r from-indigo-700 via-purple-700 to-indigo-800 text-white text-center py-2.5 px-4 flex items-center justify-between gap-4 text-xs font-medium z-40 shadow-lg border-b border-indigo-500/20">
          <div className="flex items-center gap-2 mx-auto">
            <span className="bg-rose-500 text-[10px] uppercase font-extrabold px-1.5 py-0.5 rounded animate-pulse">{TRANSLATIONS[language].weekendClass}</span>
            <span className="font-bold">{language === 'vi' ? masterclassTitleVi : masterclassTitleEn}</span>
            <span className="opacity-80 hidden md:inline">|</span>
            <span className="opacity-90 hidden md:inline">{language === 'vi' ? masterclassSubVi : masterclassSubEn}</span>
          </div>
          <button id="register-syllabus-btn" onClick={() => setIsBookingOpen(true)} className="bg-white text-indigo-900 font-bold px-3 py-1 rounded-full text-[11px] hover:bg-indigo-50 hover:scale-105 transition-all shadow-md">
            {TRANSLATIONS[language].registerNow}
          </button>
        </div>
      )}

      {/* Header */}
      <header id="main-header" className="sticky top-0 bg-slate-950/85 backdrop-blur-md border-b border-slate-900 py-3.5 px-6 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-rose-500 flex items-center justify-center shadow-lg shadow-indigo-500/20">
            <Youtube className="w-5.5 h-5.5 text-white" />
          </div>
          <div>
            <h1 id="brand-title" className="text-lg font-black tracking-tight bg-gradient-to-r from-white via-slate-100 to-slate-400 bg-clip-text text-transparent">
              ANHY NETWORK
            </h1>
            <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">YouTube Portfolio</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Language Selector */}
          <div className="flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-slate-300 transition-all">
            <Globe className="w-3.5 h-3.5 text-indigo-400" />
            <select
              id="lang-selector"
              value={language}
              onChange={(e) => setLanguage(e.target.value as any)}
              className="bg-transparent outline-none cursor-pointer text-slate-300 pr-1 select-none font-semibold"
            >
              <option value="vi" className="bg-slate-950 text-slate-200">Tiếng Việt</option>
              <option value="en" className="bg-slate-950 text-slate-200">English</option>
              <option value="pt" className="bg-slate-950 text-slate-200">Português (BR)</option>
              <option value="ko" className="bg-slate-950 text-slate-200">한국어</option>
              <option value="ja" className="bg-slate-950 text-slate-200">日本語</option>
            </select>
          </div>

          {/* User controls */}
          {user ? (
            <div className="flex items-center gap-2">
              <div className="text-right hidden sm:block">
                <p className="text-xs font-bold text-slate-200">{user.displayName || user.email?.split('@')[0]}</p>
                <span className="text-[9px] bg-indigo-500/10 text-indigo-400 px-1.5 py-0.5 rounded border border-indigo-500/20 font-mono uppercase">
                  {userRole}
                </span>
              </div>
              
              {(userRole === 'admin' || userRole === 'editor') && (
                <button 
                  id="admin-dashboard-btn"
                  onClick={() => setIsAdminOpen(true)}
                  className="bg-indigo-600/10 hover:bg-indigo-600/20 border border-indigo-500/30 text-indigo-400 p-2 rounded-lg text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
                  title={TRANSLATIONS[language].adminDashboard}
                >
                  <Settings className="w-4 h-4" />
                </button>
              )}

              <button 
                id="signout-btn"
                onClick={handleSignOut}
                className="bg-slate-900 hover:bg-red-950/40 border border-slate-800 hover:border-red-900/30 text-slate-400 hover:text-red-400 p-2 rounded-lg transition-all cursor-pointer"
                title="Sign out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button 
              id="signin-modal-trigger"
              onClick={() => { setIsSignUpMode(false); setIsAuthOpen(true); }}
              className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white px-3.5 py-1.5 rounded-lg text-xs font-bold shadow-lg shadow-indigo-600/10 flex items-center gap-1.5 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>
                {language === 'vi' ? 'Đăng Nhập' : language === 'en' ? 'Log In' : language === 'pt' ? 'Entrar' : language === 'ko' ? '로그인' : 'ログイン'}
              </span>
            </button>
          )}
        </div>
      </header>

      {/* Hero Welcome Message */}
      <section id="hero-welcome" className="relative overflow-hidden bg-slate-950 py-10 px-6 text-center border-b border-slate-900">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[250px] bg-indigo-600/10 blur-[120px] rounded-full pointer-events-none" />
        <div className="relative max-w-4xl mx-auto z-10">
          <span className="text-[10px] bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-2.5 py-1 rounded-full font-extrabold uppercase tracking-widest inline-flex items-center gap-1 mb-3">
            <Sparkles className="w-3 h-3" /> OFFICIAL CREATOR PLATFORM
          </span>
          <h2 id="hero-main-title" className="text-3xl md:text-5xl font-black tracking-tight leading-tight mb-4 text-white">
            {TRANSLATIONS[language].heroTitle}
          </h2>
          <p className="text-slate-400 text-sm md:text-base max-w-2xl mx-auto leading-relaxed">
            {TRANSLATIONS[language].heroSub
              .replace(/2\.47M/g, dynamicStats.subscribers)
              .replace(/2\.47 triệu/g, `${dynamicStats.subscribers} ${language === 'vi' ? 'triệu' : ''}`)
              .replace(/247만/g, dynamicStats.subscribers)
            }
          </p>
        </div>
      </section>

      {/* Main Content Areas */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 md:px-6 py-8">
        
        {/* Filtering & Search Controls Area */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-900">
          {/* Multichannel Filters */}
          <div id="channel-tabs" className="flex items-center gap-2 overflow-x-auto scrollbar-none flex-1 max-w-full">
            <button
              id="filter-all-btn"
              onClick={() => setActiveChannelId('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                activeChannelId === 'all'
                  ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                  : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
              }`}
            >
              🌎 All Ecosystem ({filteredVideos.length})
            </button>
            {visibleChannels.map((ch) => (
              <button
                id={`filter-${ch.id}-btn`}
                key={ch.id}
                onClick={() => setActiveChannelId(ch.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all whitespace-nowrap cursor-pointer ${
                  activeChannelId === ch.id
                    ? 'bg-slate-100 text-slate-950 shadow-lg'
                    : 'bg-slate-900 text-slate-400 hover:bg-slate-850 hover:text-slate-200'
                }`}
              >
                <span>{ch.emoji}</span>
                <span>{ch.name}</span>
                {ch.isHidden && (
                  <EyeOff className="w-3 h-3 text-red-400" title="Hidden" />
                )}
              </button>
            ))}
          </div>

          {/* Real-time Video Search */}
          <div className="relative flex-shrink-0 w-full lg:w-80">
            <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
              <Search className="h-4 w-4 text-slate-500" />
            </div>
            <input
              id="video-search-input"
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={language === 'vi' ? 'Tìm kiếm video theo tiêu đề hoặc mô tả...' : 'Search videos by title or desc...'}
              className="w-full bg-slate-900 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl pl-10 pr-10 py-2.5 text-xs text-white placeholder-slate-500 outline-none transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-slate-500 hover:text-slate-300 transition-colors cursor-pointer"
                title={language === 'vi' ? 'Xóa tìm kiếm' : 'Clear search'}
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
        </div>

        {/* BENTO GRID LAYOUT */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* LEFT SIDE: Active Video Player & Comments Hub (Takes 8 cols) */}
          <div className="lg:col-span-8 flex flex-col gap-6">
            
            {/* GRID BLOCK 1: Dynamic Video Player Frame */}
            {isMiniPlayer && (
              <div className="bg-slate-900/10 border border-dashed border-slate-800/80 rounded-2xl p-6 flex flex-col items-center justify-center text-center gap-3 min-h-[260px] md:min-h-[320px] lg:min-h-[400px]">
                <div className="w-12 h-12 rounded-full bg-indigo-500/10 flex items-center justify-center text-indigo-400">
                  <Play className="w-5 h-5 animate-pulse" />
                </div>
                <div className="flex flex-col gap-1">
                  <p className="text-xs font-bold text-slate-350">
                    {TRANSLATIONS[language].playingInMini}
                  </p>
                  <p className="text-[10px] text-slate-500 max-w-xs mx-auto truncate font-medium">
                    {activeVideo?.title}
                  </p>
                </div>
                <button
                  onClick={() => setIsMiniPlayer(false)}
                  className="bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-400 px-3.5 py-1.5 rounded-lg text-xs font-bold border border-indigo-500/20 hover:border-indigo-500/30 transition-all cursor-pointer flex items-center gap-1.5 active:scale-95 mt-1"
                >
                  <Maximize2 className="w-3.5 h-3.5" />
                  <span>{TRANSLATIONS[language].restoreBtn}</span>
                </button>
              </div>
            )}

            <div 
              id="video-player-card" 
              className={
                isMiniPlayer 
                  ? "fixed bottom-6 right-6 w-[340px] md:w-[380px] z-50 shadow-2xl border border-indigo-500/30 rounded-2xl overflow-hidden bg-slate-950/95 backdrop-blur-md animate-in slide-in-from-bottom-5 duration-300"
                  : "bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl overflow-hidden shadow-xl"
              }
            >
              <div className="p-4 bg-slate-950/50 border-b border-slate-900/60 flex items-center justify-between relative z-40">
                {isMiniPlayer ? (
                  <span className="text-[11px] text-slate-200 font-semibold truncate max-w-[140px] md:max-w-[180px] flex items-center gap-1.5" title={activeVideo?.title}>
                    {activeVideo?.isLive && (
                      <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
                    )}
                    <span>{activeVideo?.title}</span>
                  </span>
                ) : (
                  <span className="text-[10px] text-indigo-400 uppercase font-mono tracking-widest font-extrabold flex items-center gap-2">
                    {activeVideo?.isLive ? (
                      <>
                        <span className="flex h-2 w-2 relative">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                        </span>
                        <span className="text-red-500 font-black tracking-wider">{TRANSLATIONS[language].liveBadge}</span>
                      </>
                    ) : (
                      <>
                        <Play className="w-3.5 h-3.5 fill-current" />
                        <span>{TRANSLATIONS[language].activeVideo}</span>
                      </>
                    )}
                  </span>
                )}
                
                <div className="flex items-center gap-2">
                  {isMiniPlayer ? (
                    <>
                      <button
                        onClick={() => setIsMiniPlayer(false)}
                        className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-indigo-400 transition-colors cursor-pointer"
                        title={TRANSLATIONS[language].restoreBtn}
                      >
                        <Maximize2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setIsMiniPlayer(false)}
                        className="p-1.5 hover:bg-slate-900 rounded-lg text-slate-400 hover:text-rose-400 transition-colors cursor-pointer"
                        title={TRANSLATIONS[language].close}
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </>
                  ) : (
                    <>
                      {activeVideo && (
                        <span className="bg-slate-900 text-[10px] text-indigo-300 font-mono font-bold px-2.5 py-1 rounded-lg border border-indigo-500/10">
                          {activeVideo.quality}
                        </span>
                      )}
                      {activeVideo && (
                        <button
                          id="toggle-mini-player-btn"
                          onClick={() => setIsMiniPlayer(true)}
                          className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-indigo-400 px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm"
                          title={TRANSLATIONS[language].miniPlayerBtn}
                        >
                          <Minimize2 className="w-3.5 h-3.5" />
                          <span>{TRANSLATIONS[language].miniPlayerBtn}</span>
                        </button>
                      )}
                    </>
                  )}
                  {activeVideo && !isMiniPlayer && (
                    <div className="relative">
                      <button
                        id="share-video-header-btn"
                        onClick={() => setIsShareOpen(!isShareOpen)}
                        className="bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1.5 border border-slate-800 hover:border-slate-700 transition-all cursor-pointer shadow-sm"
                      >
                        <Share2 className="w-3.5 h-3.5" />
                        <span>{TRANSLATIONS[language].shareBtn}</span>
                      </button>

                      {isShareOpen && (
                        <>
                          <div className="fixed inset-0 z-40" onClick={() => setIsShareOpen(false)} />
                          <div className="absolute right-0 mt-2 w-72 bg-slate-950 border border-slate-850 rounded-xl p-4 shadow-2xl z-50 text-left">
                            <div className="flex items-center justify-between mb-3">
                              <h4 className="text-xs font-extrabold text-slate-200 flex items-center gap-1.5">
                                <Share2 className="w-3.5 h-3.5 text-indigo-400" />
                                <span>{TRANSLATIONS[language].shareTitle}</span>
                              </h4>
                              <button 
                                onClick={() => setIsShareOpen(false)}
                                className="text-slate-500 hover:text-slate-300 cursor-pointer p-0.5"
                              >
                                <X className="w-3.5 h-3.5" />
                              </button>
                            </div>
                            
                            <p className="text-[10px] text-slate-400 mb-3 font-medium leading-normal truncate">
                              {activeVideo.title}
                            </p>
                            
                            {/* Copy Link Input */}
                            <div className="flex gap-1.5 mb-3.5">
                              <input
                                type="text"
                                readOnly
                                value={getShareUrl(activeVideo.id)}
                                className="flex-1 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-[10px] text-slate-300 select-all outline-none font-mono"
                              />
                              <button
                                onClick={() => handleCopyLink(activeVideo.id)}
                                className="bg-indigo-600 hover:bg-indigo-500 text-white px-3 py-1.5 rounded-lg text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer flex-shrink-0"
                              >
                                {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                <span>{copied ? TRANSLATIONS[language].linkCopied : TRANSLATIONS[language].copyLink}</span>
                              </button>
                            </div>
                            
                            {/* Social sharing buttons */}
                            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-slate-900">
                              <a
                                href={`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(getShareUrl(activeVideo.id))}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 bg-[#1877F2]/10 hover:bg-[#1877F2]/20 border border-[#1877F2]/20 hover:border-[#1877F2]/30 text-[#1877F2] text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer"
                              >
                                <span className="text-xs">📘</span>
                                <span>Facebook</span>
                              </a>
                              <a
                                href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(getShareUrl(activeVideo.id))}&text=${encodeURIComponent(activeVideo.title)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex items-center justify-center gap-1.5 bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-white text-[10px] font-bold py-2 rounded-lg transition-all cursor-pointer"
                              >
                                <span className="text-xs">🐦</span>
                                <span>Twitter</span>
                              </a>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {activeVideo ? (
                <motion.div
                  key={activeVideo.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.35, ease: "easeOut" }}
                >
                  {/* YouTube Iframe Embedded Player */}
                  {youtubeEmbedUrl ? (
                    <div className="relative aspect-video w-full bg-black">
                      <iframe
                        src={youtubeEmbedUrl}
                        title={activeVideo.title}
                        className="absolute inset-0 w-full h-full border-0"
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                      />
                    </div>
                  ) : (
                    <div className={`aspect-video w-full bg-gradient-to-br ${activeVideo.thumbnailGradient} flex flex-col items-center justify-center relative p-6 text-center`}>
                      <div className="w-16 h-16 rounded-full bg-white/10 hover:bg-indigo-600 backdrop-blur-md flex items-center justify-center cursor-pointer transition-all hover:scale-110 shadow-lg group">
                        <Play className="w-7 h-7 text-white fill-current group-hover:scale-105" />
                      </div>
                      <p className="text-xs text-slate-400 mt-4 max-w-sm">
                        Embed player requires standard YouTube URL link. Click to view externally.
                      </p>
                    </div>
                  )}

                  {/* Video Meta Information */}
                  {!isMiniPlayer && (
                    <div className="p-6">
                      <h3 className="text-xl md:text-2xl font-black text-white tracking-tight mb-2 flex items-center gap-2.5 flex-wrap">
                        <span>{activeVideo.title}</span>
                        {activeVideo.isLive && (
                          <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-red-600/10 border border-red-500/20 text-[10px] font-black text-red-500 uppercase tracking-widest animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                            {TRANSLATIONS[language].liveBadge}
                          </span>
                        )}
                      </h3>

                      <div className="flex flex-wrap items-center justify-between gap-4 py-4 border-y border-slate-900">
                        <div className="flex items-center gap-5 text-xs text-slate-400 font-mono">
                          {activeVideo.isLive ? (
                            <span className="flex items-center gap-1.5 text-red-400 font-bold tracking-tight animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-red-500" />
                              {TRANSLATIONS[language].liveBroadcasting}
                            </span>
                          ) : (
                            <>
                              <span className="flex items-center gap-1"><Eye className="w-4 h-4 text-slate-500" /> {activeVideo.views}</span>
                              <span className="flex items-center gap-1"><Clock className="w-4 h-4 text-slate-500" /> {activeVideo.duration}</span>
                            </>
                          )}
                        </div>
                        
                        <div className="flex flex-wrap items-center gap-3">
                          <div className="flex flex-col gap-1 min-w-[150px]">
                            <div className="flex items-center bg-slate-950 border border-slate-900 rounded-xl overflow-hidden p-0.5">
                              <button 
                                id="like-video-btn"
                                onClick={() => handleLikeVideo(activeVideo.id)}
                                className="flex-1 hover:bg-indigo-600/10 text-indigo-400 hover:text-indigo-300 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                title={TRANSLATIONS[language].likeBtn}
                              >
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>{activeVideo.likes.toLocaleString()}</span>
                              </button>
                              
                              <div className="h-4 w-[1px] bg-slate-900" />
                              
                              <button 
                                id="dislike-video-btn"
                                onClick={() => handleDislikeVideo(activeVideo.id)}
                                className="flex-1 hover:bg-rose-600/10 text-slate-400 hover:text-rose-400 px-3 py-1.5 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 active:scale-95 transition-all cursor-pointer"
                                title={TRANSLATIONS[language].dislikeBtn}
                              >
                                <ThumbsDown className="w-3.5 h-3.5" />
                                <span>{(activeVideo.dislikes || 0).toLocaleString()}</span>
                              </button>
                            </div>
                            
                            {/* Sentiment Ratio Bar */}
                            {(() => {
                              const likes = activeVideo.likes || 0;
                              const dislikes = activeVideo.dislikes || 0;
                              const total = likes + dislikes;
                              const ratio = total > 0 ? (likes / total) * 100 : 100;
                              return (
                                <div className="w-full px-1">
                                  <div className="h-1 w-full bg-rose-600/20 rounded-full overflow-hidden">
                                    <div 
                                      className="h-full bg-indigo-500 rounded-full transition-all duration-500" 
                                      style={{ width: `${ratio}%` }}
                                    />
                                  </div>
                                  <div className="flex justify-between items-center mt-1 text-[9px] text-slate-500 font-mono font-bold uppercase tracking-wider">
                                    <span>{ratio.toFixed(0)}% {language === 'vi' ? 'đồng thuận' : 'likes'}</span>
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                          
                          <a 
                            href={activeVideo.url} 
                            target="_blank" 
                            rel="noreferrer" 
                            onClick={() => handleIncrementViews(activeVideo.id)}
                            className="bg-slate-900 hover:bg-slate-800 border border-slate-800 hover:border-slate-700 text-slate-300 px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer h-10"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>YouTube</span>
                          </a>

                          {userRole === 'admin' && (
                            <button
                              onClick={() => handleDeleteVideo(activeVideo.id)}
                              className="bg-red-950/40 border border-red-900/30 text-red-400 hover:bg-red-900 hover:text-white p-2 rounded-xl transition-all cursor-pointer"
                              title="Xóa video"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      <p className="text-xs md:text-sm text-slate-400 mt-4 leading-relaxed bg-slate-950/20 p-4 rounded-xl border border-slate-900">
                        {activeVideo.description}
                      </p>
                    </div>
                  )}
                </motion.div>
              ) : (
                <div className="p-12 text-center text-slate-500 text-sm">
                  {TRANSLATIONS[language].noVideos}
                </div>
              )}
            </div>

            {/* GRID BLOCK 2: Comments and Community Hub */}
            <div id="comments-hub" className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                  <MessageSquare className="w-4 h-4 text-indigo-400" />
                  {TRANSLATIONS[language].commentsTitle} ({activeComments.length})
                </h4>
              </div>

              {/* Comments Feed list */}
              <div className="max-h-[300px] overflow-y-auto pr-2 flex flex-col gap-3 scrollbar-thin">
                {activeComments.length > 0 ? (
                  activeComments.map((comment) => (
                    <div key={comment.id} className="bg-slate-950/40 border border-slate-900 p-3.5 rounded-xl flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-extrabold text-indigo-300">{comment.author}</span>
                          <span className="text-[9px] text-slate-500 font-mono">{comment.timestamp}</span>
                        </div>
                        <p className="text-xs text-slate-300 leading-relaxed">{comment.text}</p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button 
                          onClick={() => handleLikeComment(comment.id)}
                          className="bg-slate-900 hover:bg-slate-800 border border-slate-850 text-slate-400 hover:text-rose-400 p-1.5 rounded-lg text-xs flex items-center gap-1 transition-all"
                        >
                          <Heart className="w-3 h-3" />
                          <span className="font-mono text-[10px]">{comment.likes}</span>
                        </button>

                        {(userRole === 'admin' || userRole === 'editor') && (
                          <button 
                            onClick={() => handleDeleteComment(comment.id)}
                            className="bg-red-950/20 hover:bg-red-900 border border-red-900/20 text-red-400 hover:text-white p-1.5 rounded-lg transition-all"
                            title="Delete"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-xs text-slate-500 italic text-center py-6">Be the first to share your thoughts on this video!</p>
                )}
              </div>

              {/* Submit comment input */}
              {user ? (
                <form onSubmit={handleCommentSubmit} className="flex gap-2.5">
                  <input
                    id="comment-input-field"
                    type="text"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    placeholder={TRANSLATIONS[language].writeComment}
                    className="flex-1 bg-slate-950 border border-slate-900 focus:border-indigo-500 rounded-xl px-4 py-2.5 text-xs text-white outline-none transition-colors"
                  />
                  <button 
                    id="comment-submit-btn"
                    type="submit" 
                    className="bg-indigo-600 hover:bg-indigo-500 text-white px-4 py-2.5 rounded-xl text-xs font-bold flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                  >
                    <Send className="w-3.5 h-3.5" />
                    <span>{TRANSLATIONS[language].sendComment}</span>
                  </button>
                </form>
              ) : (
                <div className="bg-slate-950/50 border border-dashed border-slate-900 p-4 rounded-xl text-center">
                  <button 
                    id="signin-comment-trigger"
                    onClick={() => { setIsSignUpMode(false); setIsAuthOpen(true); }}
                    className="text-xs font-bold text-indigo-400 hover:text-indigo-300 underline"
                  >
                    {TRANSLATIONS[language].loginToComment}
                  </button>
                </div>
              )}
            </div>

          </div>

          {/* RIGHT SIDE: Bento Modules (Takes 4 cols) */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            
            {/* GRID BLOCK 3: Channels Ecosystem list */}
            <div id="channels-ecosystem-card" className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {TRANSLATIONS[language].channelsTitle}
                </h4>
                {(userRole === 'admin' || userRole === 'editor') && (
                  <button 
                    id="add-channel-trigger"
                    onClick={() => { setEditingChannel({}); setIsAddChannelOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-lg text-xs"
                    title={TRANSLATIONS[language].addChannel}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <div className="flex flex-col gap-3">
                {visibleChannels.map((ch) => (
                  <div 
                    key={ch.id} 
                    onClick={() => setActiveChannelId(ch.id)}
                    className={`p-3.5 rounded-xl border transition-all relative group cursor-pointer ${
                      activeChannelId === ch.id 
                        ? 'bg-indigo-600/10 border-indigo-500/30 shadow-md ring-1 ring-indigo-500/10' 
                        : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-3 mb-2.5">
                      <span className="text-2xl">{ch.emoji}</span>
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <h5 className="text-xs font-extrabold text-white flex items-center gap-1.5">
                            <span>{ch.name}</span>
                            {ch.isHidden && (
                              <span className="px-1 py-0.5 rounded bg-red-950 text-[8px] font-bold text-red-400 border border-red-900/50 uppercase">
                                HIDDEN
                              </span>
                            )}
                          </h5>
                          
                          <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            {(userRole === 'admin' || userRole === 'editor') && (
                              <button
                                onClick={(e) => { e.stopPropagation(); setEditingChannel(ch); setIsAddChannelOpen(true); }}
                                className="text-slate-400 hover:text-white p-1 cursor-pointer"
                              >
                                <Edit2 className="w-3 h-3" />
                              </button>
                            )}
                            {userRole === 'admin' && (
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDeleteChannel(ch.id); }}
                                className="text-red-400 hover:text-red-500 p-1 cursor-pointer"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                        </div>
                        <span className="text-[10px] text-slate-500 font-mono tracking-widest font-bold uppercase">{ch.tag}</span>
                      </div>
                    </div>

                    <p className="text-[11px] text-slate-400 leading-relaxed mb-3 line-clamp-2">{ch.description}</p>

                    <div className="grid grid-cols-3 gap-2 bg-slate-950/60 p-2.5 rounded-lg text-center text-[10px] font-mono border border-slate-900">
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">{TRANSLATIONS[language].subscribers}</span>
                        <span className="font-extrabold text-slate-200">{ch.subscribers}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">{TRANSLATIONS[language].views}</span>
                        <span className="font-extrabold text-slate-200">{ch.views}</span>
                      </div>
                      <div>
                        <span className="block text-slate-500 uppercase text-[8px] tracking-wider mb-0.5">{TRANSLATIONS[language].growth}</span>
                        <span className="font-extrabold text-indigo-400">{ch.growth.split(' ')[0]}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-3.5">
                      {ch.subscribeUrl && (
                        <a 
                          href={ch.subscribeUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-rose-600 hover:bg-rose-500 text-white text-center py-1.5 rounded-lg text-[10px] font-bold tracking-tight uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                        >
                          <Youtube className="w-3.5 h-3.5" />
                          <span>{TRANSLATIONS[language].subscribeBtn}</span>
                        </a>
                      )}
                      {ch.channelUrl && (
                        <a 
                          href={ch.channelUrl} 
                          target="_blank" 
                          rel="noreferrer" 
                          onClick={(e) => e.stopPropagation()}
                          className="flex-1 bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 text-center py-1.5 rounded-lg text-[10px] font-bold tracking-tight uppercase transition-all cursor-pointer"
                        >
                          {TRANSLATIONS[language].viewChannel}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* GRID BLOCK 4: Creator Profile Card */}
            <div id="creator-bio-card" className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl relative overflow-hidden flex flex-col gap-4">
              <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/5 blur-3xl rounded-full pointer-events-none" />
              
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center text-white text-xl font-black shadow-lg">
                  AH
                </div>
                <div>
                  <h4 className="text-sm font-black text-slate-100 flex items-center gap-1.5">
                    AnHy Network Crew <span className="w-2 h-2 bg-emerald-500 rounded-full animate-ping" title="Active" />
                  </h4>
                  <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest">Global Digital Network</p>
                </div>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {TRANSLATIONS[language].aboutDesc}
              </p>

              <button 
                id="book-sponsor-trigger"
                onClick={() => setIsBookingOpen(true)}
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-extrabold text-xs py-2.5 rounded-xl uppercase tracking-wider flex items-center justify-center gap-1.5 shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all"
              >
                <Briefcase className="w-4 h-4" />
                <span>{TRANSLATIONS[language].bookSponsor}</span>
              </button>
            </div>

            {/* GRID BLOCK 5: Diagnostic Analytics Tracker */}
            <div id="network-diagnostics" className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-3">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1 flex items-center gap-1.5">
                <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                {TRANSLATIONS[language].liveStats}
              </h4>

              <div className="flex flex-col gap-2.5 font-mono text-xs">
                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-slate-500">{TRANSLATIONS[language].totalSubs}</span>
                  <span className="text-slate-200 font-extrabold text-sm">
                    {dynamicStats.subscribers} {TRANSLATIONS[language].subscribers?.toLowerCase() || 'subscribers'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2 border-b border-slate-900">
                  <span className="text-slate-500">{TRANSLATIONS[language].totalViews}</span>
                  <span className="text-slate-200 font-extrabold text-sm">
                    {dynamicStats.views} {TRANSLATIONS[language].views?.toLowerCase() || 'views'}
                  </span>
                </div>
                <div className="flex justify-between items-center py-2">
                  <span className="text-slate-500">{TRANSLATIONS[language].activeSince}</span>
                  <span className="text-slate-200 font-extrabold">
                    {dynamicStats.activeSince}
                  </span>
                </div>
              </div>
            </div>

            {/* Videos Selection List Block (under diagnostics) */}
            <div id="videos-selection-block" className="bg-slate-900/40 backdrop-blur-md border border-slate-900 rounded-2xl p-6 shadow-xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-slate-900 pb-3">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-200">
                  {TRANSLATIONS[language].activeVideo} ({filteredVideos.length})
                </h4>
                {(userRole === 'admin' || userRole === 'editor') && (
                  <button 
                    id="add-video-trigger"
                    onClick={() => { setEditingVideo({}); setIsAddVideoOpen(true); }}
                    className="bg-indigo-600 hover:bg-indigo-500 text-white p-1 rounded-lg text-xs"
                    title={TRANSLATIONS[language].addVideo}
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Sorting Filter Selector */}
              <div className="flex items-center justify-between text-[10px] bg-slate-950/30 p-2 rounded-xl border border-slate-900">
                <span className="text-slate-500 font-bold uppercase tracking-wider flex items-center gap-1.5">
                  <SlidersHorizontal className="w-3 h-3 text-indigo-400" />
                  <span>{language === 'vi' ? 'Sắp xếp' : 'Sort'}</span>
                </span>
                <div className="flex gap-1.5">
                  {(['newest', 'views', 'likes'] as const).map((mode) => (
                    <button
                      key={mode}
                      onClick={() => setSidebarSortBy(mode)}
                      className={`px-2 py-0.5 rounded font-black uppercase text-[9px] transition-all ${
                        sidebarSortBy === mode
                          ? 'bg-indigo-600/20 text-indigo-400 border border-indigo-500/30'
                          : 'text-slate-500 hover:text-slate-300'
                      }`}
                    >
                      {mode === 'newest' ? (language === 'vi' ? 'Mới' : 'New') : mode === 'views' ? (language === 'vi' ? 'Xem' : 'Views') : (language === 'vi' ? 'Thích' : 'Likes')}
                    </button>
                  ))}
                </div>
              </div>

              <div className="max-h-[350px] overflow-y-auto pr-2 flex flex-col gap-2.5 scrollbar-thin">
                {paginatedSidebarVideos.length > 0 ? (
                  paginatedSidebarVideos.map((vid) => (
                    <button 
                      key={vid.id}
                      onClick={() => { setActiveVideoId(vid.id); handleIncrementViews(vid.id); }}
                      className={`p-3 rounded-xl text-left border flex items-center gap-3 transition-all relative group cursor-pointer ${
                        activeVideo?.id === vid.id 
                          ? 'bg-indigo-600/10 border-indigo-500/30' 
                          : 'bg-slate-950/40 border-slate-900 hover:border-slate-800'
                      }`}
                    >
                      <div className="w-10 h-10 rounded-lg bg-slate-950 flex items-center justify-center text-indigo-400 group-hover:scale-105 transition-transform flex-shrink-0 relative">
                        {vid.isLive ? (
                          <div className="absolute inset-0 rounded-lg border border-red-500/40 animate-pulse flex items-center justify-center">
                            <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping absolute" />
                            <span className="w-2 h-2 rounded-full bg-red-500 relative" />
                          </div>
                        ) : (
                          <Play className="w-4 h-4 fill-current" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 justify-between">
                          <p className="text-xs font-bold text-slate-200 truncate group-hover:text-white flex-1">{vid.title}</p>
                          {vid.isLive && (
                            <span className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/15 text-[8px] font-black text-red-400 border border-red-500/20 uppercase tracking-widest flex-shrink-0 animate-pulse">
                              {TRANSLATIONS[language].liveBadge}
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[9px] text-slate-500 font-mono">
                          {vid.isLive ? (
                            <span className="text-red-400 font-bold tracking-tight">{TRANSLATIONS[language].liveBroadcasting}</span>
                          ) : (
                            <>
                              <span>{vid.duration}</span>
                              <span>•</span>
                              <span>{vid.views.split(' ')[0]} views</span>
                            </>
                          )}
                        </div>
                      </div>
                      {(userRole === 'admin' || userRole === 'editor') && (
                        <div className="absolute right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1 z-10">
                          <span onClick={(e) => { e.stopPropagation(); setEditingVideo(vid); setIsAddVideoOpen(true); }} className="text-slate-400 hover:text-white p-1">
                            <Edit2 className="w-3 h-3" />
                          </span>
                        </div>
                      )}
                    </button>
                  ))
                ) : (
                  <div className="text-center py-8 text-slate-500 text-xs italic">
                    {language === 'vi' ? 'Không tìm thấy video phù hợp' : 'No matching videos found'}
                  </div>
                )}
              </div>

              {/* Sidebar Pagination Controls */}
              {totalSidebarPages > 1 && (
                <div className="flex items-center justify-between border-t border-slate-900 pt-3 text-xs">
                  <button
                    onClick={() => setSidebarPage(p => Math.max(1, p - 1))}
                    disabled={sidebarPage === 1}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  
                  <span className="text-[10px] font-mono text-slate-500 font-bold uppercase">
                    {language === 'vi' ? 'Trang' : 'Page'} {sidebarPage} / {totalSidebarPages}
                  </span>

                  <button
                    onClick={() => setSidebarPage(p => Math.min(totalSidebarPages, p + 1))}
                    disabled={sidebarPage === totalSidebarPages}
                    className="p-1.5 rounded-lg bg-slate-950 border border-slate-900 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors cursor-pointer"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>

          </div>
        </div>

      </main>

      {/* Footer */}
      <footer className="bg-slate-950 border-t border-slate-900 py-8 px-6 text-center text-xs text-slate-500">
        <div className="max-w-4xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <p>© 2026 AnHy Network. All rights reserved. US-standard multi-channel promotional hub.</p>
          <div className="flex items-center gap-4">
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Privacy Policy</span>
            <span>•</span>
            <span className="hover:text-slate-300 transition-colors cursor-pointer">Terms of Service</span>
          </div>
        </div>
      </footer>

      {/* MODAL 1: Book Sponsor Slots / Masterclass Signup */}
      {isBookingOpen && (
        <div id="booking-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200 flex items-center gap-2">
                <Briefcase className="w-4 h-4 text-indigo-400" />
                {TRANSLATIONS[language].bookSponsor}
              </h3>
              <button 
                id="close-booking-modal"
                onClick={() => setIsBookingOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              {bookingSuccess ? (
                <div className="text-center py-8">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/10 text-emerald-400 flex items-center justify-center mx-auto mb-4 border border-emerald-500/20">
                    <Check className="w-6 h-6" />
                  </div>
                  <p className="text-sm font-bold text-slate-200">{TRANSLATIONS[language].bookingSuccessMsg}</p>
                </div>
              ) : (
                <form onSubmit={handleBookingSubmit} className="flex flex-col gap-4">
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Full Name</label>
                    <input
                      required
                      type="text"
                      value={bookingForm.fullName}
                      onChange={(e) => setBookingForm({...bookingForm, fullName: e.target.value})}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Business Email</label>
                      <input
                        required
                        type="email"
                        value={bookingForm.email}
                        onChange={(e) => setBookingForm({...bookingForm, email: e.target.value})}
                        placeholder="jane@company.com"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                    <div>
                      <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Company Name</label>
                      <input
                        type="text"
                        value={bookingForm.companyName}
                        onChange={(e) => setBookingForm({...bookingForm, companyName: e.target.value})}
                        placeholder="Acme Corp"
                        className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Purpose of contact</label>
                    <select
                      value={bookingForm.purpose}
                      onChange={(e) => setBookingForm({...bookingForm, purpose: e.target.value})}
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3 py-2 text-xs text-white outline-none"
                    >
                      <option value="">Choose options...</option>
                      <option value="Sponsorship">YouTube Sponsor Integration</option>
                      <option value="Affiliation">Affiliate Marketing Promotion</option>
                      <option value="Masterclass">Masterclass Registration Syllabus</option>
                      <option value="Other">Other business inquiry</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Message proposal</label>
                    <textarea
                      required
                      rows={3}
                      value={bookingForm.message}
                      onChange={(e) => setBookingForm({...bookingForm, message: e.target.value})}
                      placeholder="Please outline your requirements..."
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none resize-none"
                    />
                  </div>

                  <button 
                    id="submit-booking-form"
                    type="submit" 
                    className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-[0.98] transition-all mt-2"
                  >
                    Submit Proposal
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL 2: Authentications Portal */}
      {isAuthOpen && (
        <div id="auth-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div>
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  {TRANSLATIONS[language].authTitle}
                </h3>
                <p className="text-[10px] text-slate-500 mt-0.5">{TRANSLATIONS[language].authSub}</p>
              </div>
              <button 
                id="close-auth-modal"
                onClick={() => setIsAuthOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6">
              <form onSubmit={handleAuthSubmit} className="flex flex-col gap-4">
                {isSignUpMode && (
                  <div>
                    <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Display Name</label>
                    <input
                      type="text"
                      value={authName}
                      onChange={(e) => setAuthName(e.target.value)}
                      placeholder="Jane Doe"
                      className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Email Address</label>
                  <input
                    required
                    type="email"
                    value={authEmail}
                    onChange={(e) => setAuthEmail(e.target.value)}
                    placeholder="email@example.com"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Password</label>
                  <input
                    required
                    type="password"
                    value={authPassword}
                    onChange={(e) => setAuthPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full bg-slate-950 border border-slate-850 focus:border-indigo-500 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                  />
                </div>

                <button 
                  id="submit-auth-form"
                  type="submit" 
                  className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold py-2.5 rounded-xl text-xs uppercase tracking-wider shadow-lg shadow-indigo-600/10 cursor-pointer active:scale-95 transition-all mt-2"
                >
                  {isSignUpMode ? 'Sign Up' : 'Sign In'}
                </button>
              </form>

              <div className="text-center mt-5">
                <button
                  id="toggle-auth-mode-btn"
                  onClick={() => setIsSignUpMode(!isSignUpMode)}
                  className="text-xs text-indigo-400 hover:text-indigo-300 font-semibold"
                >
                  {isSignUpMode ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: Administrative Control Panel / Editor Console */}
      {isAdminOpen && (userRole === 'admin' || userRole === 'editor') && (
        <div id="admin-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[85vh] overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200 flex flex-col">
            
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Shield className="w-5 h-5 text-indigo-400" />
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                  {TRANSLATIONS[language].adminDashboard}
                </h3>
              </div>
              <button 
                id="close-admin-modal"
                onClick={() => setIsAdminOpen(false)} 
                className="text-slate-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs Selector Header */}
            <div className="flex bg-slate-950 border-b border-slate-800 px-6 gap-6 flex-shrink-0 overflow-x-auto scrollbar-none">
              <button
                onClick={() => setAdminActiveTab('configs')}
                className={`py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  adminActiveTab === 'configs'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'vi' ? 'Cấu hình & Thành viên' : 'Configs & Members'}
              </button>
              <button
                onClick={() => setAdminActiveTab('channels')}
                className={`py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  adminActiveTab === 'channels'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'vi' ? 'Quản lý Kênh' : 'Manage Channels'} ({channels.length})
              </button>
              <button
                onClick={() => setAdminActiveTab('videos')}
                className={`py-3.5 text-xs font-black uppercase tracking-wider transition-all border-b-2 cursor-pointer whitespace-nowrap ${
                  adminActiveTab === 'videos'
                    ? 'border-indigo-500 text-indigo-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
              >
                {language === 'vi' ? 'Quản lý Video' : 'Manage Videos'} ({videos.length})
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 flex flex-col gap-8">
              
              {/* TAB 1: General Configurations & Members */}
              {adminActiveTab === 'configs' && (
                <>
                  {/* SECTION: Global Configurations (Admin Only) */}
                  {userRole === 'admin' && (
                    <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                      <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4 flex items-center gap-1">
                        <Edit2 className="w-4 h-4 text-indigo-400" /> Global Promotion settings (Masterclass weekend countdown banner)
                      </h4>
                      <form onSubmit={handleSaveMasterclass} className="flex flex-col gap-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Slogan Tiếng Việt</label>
                            <input
                              type="text"
                              value={masterclassTitleVi}
                              onChange={(e) => setMasterclassTitleVi(e.target.value)}
                              placeholder="Học Trực Tuyến AI 2026 Đặc Biệt"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Mô tả phụ Tiếng Việt</label>
                            <input
                              type="text"
                              value={masterclassSubVi}
                              onChange={(e) => setMasterclassSubVi(e.target.value)}
                              placeholder="Nhận giáo án đầy đủ miễn phí ngay hôm nay"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                            />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">English Headline</label>
                            <input
                              type="text"
                              value={masterclassTitleEn}
                              onChange={(e) => setMasterclassTitleEn(e.target.value)}
                              placeholder="Special AI Masterclass weekend 2026"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                            />
                          </div>
                          <div>
                            <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">English Description</label>
                            <input
                              type="text"
                              value={masterclassSubEn}
                              onChange={(e) => setMasterclassSubEn(e.target.value)}
                              placeholder="Get free premium study guide and resources pack"
                              className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3.5 py-2 text-xs text-white outline-none"
                            />
                          </div>
                        </div>

                        <button 
                          type="submit" 
                          className="bg-indigo-600 hover:bg-indigo-500 text-white font-bold px-4 py-2 rounded-xl text-xs self-start transition-all cursor-pointer"
                        >
                          Save settings
                        </button>
                      </form>
                    </div>
                  )}

                  {/* SECTION: Bookings Management (Admin Only) */}
                  {userRole === 'admin' && (
                    <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                      <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">
                        {TRANSLATIONS[language].manageBookings} ({bookings.length})
                      </h4>
                      {bookings.length > 0 ? (
                        <div className="flex flex-col gap-3">
                          {bookings.map((bk) => (
                            <div key={bk.id} className="bg-slate-950/60 p-4 rounded-xl border border-slate-850 flex flex-col md:flex-row justify-between gap-4">
                              <div className="flex-1">
                                <div className="flex items-center gap-3 mb-1">
                                  <span className="text-xs font-extrabold text-slate-200">{bk.fullName}</span>
                                  <span className="text-[10px] text-slate-500 font-mono">{bk.timestamp}</span>
                                </div>
                                <div className="flex items-center gap-4 text-[11px] text-slate-400 font-mono mb-2">
                                  <span>Email: {bk.email}</span>
                                  {bk.companyName && <span>Company: {bk.companyName}</span>}
                                  {bk.purpose && <span>Purpose: {bk.purpose}</span>}
                                </div>
                                <p className="text-xs text-slate-300 bg-slate-950/40 p-3 rounded-lg border border-slate-900">{bk.message}</p>
                              </div>
                              <div className="self-start">
                                <button
                                  onClick={() => handleDeleteBooking(bk.id)}
                                  className="text-red-400 hover:text-red-500 p-2 rounded bg-slate-900 hover:bg-red-950 border border-slate-850 cursor-pointer"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-xs text-slate-500 italic">No incoming sponsor proposals found.</p>
                      )}
                    </div>
                  )}

                  {/* SECTION: Members management (Admin Only) */}
                  {userRole === 'admin' && (
                    <div className="bg-slate-950/40 border border-slate-850 p-5 rounded-2xl">
                      <h4 className="text-xs font-black uppercase text-slate-300 tracking-wider mb-4">
                        {TRANSLATIONS[language].manageUsers} ({allUsersList.length})
                      </h4>
                      <div className="flex flex-col gap-2">
                        {allUsersList.map((usr) => (
                          <div key={usr.uid} className="bg-slate-950/60 px-4 py-3 rounded-xl border border-slate-850 flex items-center justify-between gap-4">
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-bold text-slate-200 truncate">{usr.displayName || usr.email}</p>
                              <span className="text-[9px] text-slate-500 font-mono font-bold tracking-tight">{usr.email}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <select
                                value={usr.role}
                                onChange={(e) => handleUpdateUserRole(usr.uid, e.target.value as any)}
                                className="bg-slate-950 border border-slate-800 rounded-lg text-xs p-1 text-indigo-300 outline-none"
                              >
                                <option value="viewer">Viewer</option>
                                <option value="editor">Editor</option>
                                <option value="admin">Admin</option>
                              </select>
                              <button
                                onClick={() => handleDeleteUser(usr.uid)}
                                className="text-slate-400 hover:text-red-400 p-1.5 cursor-pointer"
                                title="Xóa"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Reset to Factory Defaults (Admin Only) */}
                  {userRole === 'admin' && (
                    <div className="border border-red-950/30 bg-red-950/5 p-5 rounded-2xl flex items-center justify-between gap-6">
                      <div>
                        <h5 className="text-xs font-bold text-red-400 uppercase tracking-wide">Danger Zone: Restorations</h5>
                        <p className="text-[11px] text-slate-500 mt-0.5">Reset database to default showcase template configuration. This action deletes custom changes.</p>
                      </div>
                      <button
                        onClick={handleResetDefaults}
                        className="bg-red-600 hover:bg-red-500 text-white font-bold px-4 py-2 rounded-xl text-xs transition-all cursor-pointer shadow-lg"
                      >
                        Restore Database
                      </button>
                    </div>
                  )}
                </>
              )}

              {/* TAB 2: Channels Management Workspace */}
              {adminActiveTab === 'channels' && (
                <div className="flex flex-col gap-4">
                  <div className="flex justify-between items-center bg-slate-950/40 border border-slate-850 p-4 rounded-xl">
                    <div>
                      <h4 className="text-xs font-black uppercase text-slate-200 tracking-wider">
                        {language === 'vi' ? 'Hệ thống Kênh của bạn' : 'Your YouTube Ecosystem Channels'}
                      </h4>
                      <p className="text-[10px] text-slate-500 font-medium">
                        {language === 'vi' ? 'Quản lý hiển thị và chỉnh sửa cài đặt các kênh' : 'Configure visibility rules and metadata parameters per channel'}
                      </p>
                    </div>
                    <button
                      onClick={() => { setEditingChannel({}); setIsAddChannelOpen(true); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{TRANSLATIONS[language].addChannel}</span>
                    </button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {channels.map((ch) => (
                      <div key={ch.id} className="bg-slate-950/30 border border-slate-850 p-4 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:border-slate-800 transition-all">
                        <div className="flex items-center gap-3.5 min-w-0">
                          <span className="text-3xl bg-slate-950 w-12 h-12 rounded-xl flex items-center justify-center border border-slate-900 flex-shrink-0">{ch.emoji}</span>
                          <div className="min-w-0">
                            <h5 className="text-xs font-extrabold text-white flex items-center gap-2">
                              <span>{ch.name}</span>
                              <span className="px-1.5 py-0.5 rounded bg-slate-950 border border-slate-900 text-[9px] font-bold text-slate-400 font-mono tracking-wider uppercase">{ch.tag}</span>
                            </h5>
                            <p className="text-[10px] text-slate-500 font-mono mt-0.5">ID: {ch.id} • {ch.subscribers} subs • {ch.views} views</p>
                          </div>
                        </div>
                        
                        <div className="flex items-center gap-3 w-full sm:w-auto justify-end border-t border-slate-900 sm:border-transparent pt-3 sm:pt-0 flex-wrap">
                          {/* Visit Channel Button */}
                          {ch.channelUrl && (
                            <a
                              href={ch.channelUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-850 border border-slate-800 hover:border-slate-700 text-slate-300 font-bold text-[10px] transition-all uppercase cursor-pointer"
                              title={language === 'vi' ? 'Xem Kênh YouTube' : 'Visit YouTube Channel'}
                            >
                              <ExternalLink className="w-3.5 h-3.5 text-indigo-400" />
                              <span>{TRANSLATIONS[language].viewChannel}</span>
                            </a>
                          )}

                          {/* Visibility Toggle Badge */}
                          <button
                            onClick={async () => {
                              const updatedHidden = !ch.isHidden;
                              try {
                                await setDoc(doc(db, 'channels', ch.id), { ...ch, isHidden: updatedHidden });
                                showToast(language === 'vi' ? 'Đã thay đổi trạng thái hiển thị kênh!' : 'Channel visibility updated!', 'success');
                              } catch (err) {
                                handleFirestoreError(err, OperationType.WRITE, `channels/${ch.id}`);
                              }
                            }}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border font-bold text-[10px] transition-all uppercase cursor-pointer ${
                              !ch.isHidden
                                ? 'bg-emerald-950/30 border-emerald-900/50 text-emerald-400'
                                : 'bg-red-950/30 border-red-900/50 text-red-400'
                            }`}
                            title={!ch.isHidden ? 'Click to Hide Channel' : 'Click to Show Channel'}
                          >
                            {!ch.isHidden ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                            <span>{!ch.isHidden ? (language === 'vi' ? 'Đang Hiện' : 'Visible') : (language === 'vi' ? 'Đang Ẩn' : 'Hidden')}</span>
                          </button>

                          {/* Edit & Delete */}
                          <button
                            onClick={() => { setEditingChannel(ch); setIsAddChannelOpen(true); }}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-900 text-slate-400 hover:text-white transition-colors cursor-pointer"
                            title="Edit"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteChannel(ch.id)}
                            className="p-2 rounded-xl bg-slate-950 border border-slate-900 text-red-400 hover:text-red-500 hover:bg-red-950/20 transition-all cursor-pointer"
                            title="Delete"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* TAB 3: Videos Management Workspace */}
              {adminActiveTab === 'videos' && (
                <div className="flex flex-col gap-4">
                  {/* Interactive Control Workspace */}
                  <div className="bg-slate-950/40 border border-slate-850 p-4 rounded-xl flex flex-col md:flex-row gap-4 justify-between items-stretch md:items-center">
                    <div className="flex flex-col sm:flex-row gap-3 flex-1">
                      {/* Interactive Search */}
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
                        <input
                          type="text"
                          value={adminVideoSearch}
                          onChange={(e) => setAdminVideoSearch(e.target.value)}
                          placeholder={language === 'vi' ? 'Tìm tên video...' : 'Search video titles...'}
                          className="w-full bg-slate-950 border border-slate-850 hover:border-slate-800 focus:border-indigo-500 rounded-xl pl-9 pr-4 py-2 text-xs text-white placeholder-slate-500 outline-none transition-all"
                        />
                      </div>

                      {/* Filter by Channel selection */}
                      <select
                        value={adminVideoChannelFilter}
                        onChange={(e) => setAdminVideoChannelFilter(e.target.value)}
                        className="bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="all">{language === 'vi' ? 'Tất cả Kênh' : 'All Channels'}</option>
                        {channels.map((ch) => (
                          <option key={ch.id} value={ch.id}>{ch.emoji} {ch.name}</option>
                        ))}
                      </select>

                      {/* Sorting filter options */}
                      <select
                        value={adminVideoSortBy}
                        onChange={(e) => setAdminVideoSortBy(e.target.value as any)}
                        className="bg-slate-950 border border-slate-850 text-slate-300 rounded-xl px-3 py-2 text-xs outline-none focus:border-indigo-500 cursor-pointer"
                      >
                        <option value="newest">{language === 'vi' ? 'Mới nhất' : 'Newest'}</option>
                        <option value="oldest">{language === 'vi' ? 'Cũ nhất' : 'Oldest'}</option>
                        <option value="views">{language === 'vi' ? 'Nhiều lượt xem' : 'Most Viewed'}</option>
                        <option value="likes">{language === 'vi' ? 'Nhiều lượt thích' : 'Most Liked'}</option>
                      </select>
                    </div>

                    <button
                      onClick={() => { setEditingVideo({}); setIsAddVideoOpen(true); }}
                      className="bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs px-3.5 py-2 rounded-xl flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-indigo-600/10 cursor-pointer flex-shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      <span>{TRANSLATIONS[language].addVideo}</span>
                    </button>
                  </div>

                  {/* List of Videos in Workspace */}
                  <div className="flex flex-col gap-2.5">
                    {paginatedAdminVideos.length > 0 ? (
                      paginatedAdminVideos.map((vid) => {
                        const channel = channels.find(c => c.id === vid.channelId);
                        return (
                          <div key={vid.id} className="bg-slate-950/30 border border-slate-850/60 p-3 rounded-xl flex items-center justify-between gap-4 hover:border-slate-800 transition-all">
                            <div className="min-w-0 flex-1 flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg bg-slate-950 border border-slate-900 flex items-center justify-center text-slate-500 flex-shrink-0 relative">
                                {vid.isLive ? (
                                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                ) : (
                                  <Video className="w-4 h-4 text-indigo-400" />
                                )}
                              </div>
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-slate-900 text-slate-400 border border-slate-800 font-mono">
                                    {channel ? `${channel.emoji} ${channel.name}` : vid.channelId}
                                  </span>
                                  {vid.isLive && (
                                    <span className="text-[8px] font-black text-red-400 bg-red-500/10 px-1 py-0.5 rounded border border-red-500/20 animate-pulse uppercase">
                                      LIVE
                                    </span>
                                  )}
                                </div>
                                <h5 className="text-xs font-bold text-slate-200 truncate mt-1">{vid.title}</h5>
                                <div className="flex items-center gap-3 mt-1 text-[10px] text-slate-500 font-mono">
                                  <span>Duration: {vid.duration}</span>
                                  <span>•</span>
                                  <span>{vid.views}</span>
                                  <span>•</span>
                                  <span>👍 {vid.likes || 0} likes</span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => { setEditingVideo(vid); setIsAddVideoOpen(true); }}
                                className="p-1.5 rounded bg-slate-900 text-slate-400 hover:text-white border border-slate-850 cursor-pointer"
                                title="Edit"
                              >
                                <Edit2 className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => handleDeleteVideo(vid.id)}
                                className="p-1.5 rounded bg-slate-900 text-red-400 hover:text-red-500 hover:bg-red-950/20 border border-slate-850 cursor-pointer"
                                title="Delete"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-12 text-slate-500 text-xs italic bg-slate-950/20 border border-slate-900 rounded-xl">
                        {language === 'vi' ? 'Không tìm thấy video nào!' : 'No videos found!'}
                      </div>
                    )}
                  </div>

                  {/* Administrative Workspace Pagination controls */}
                  {totalAdminVideoPages > 1 && (
                    <div className="flex items-center justify-between border-t border-slate-850/60 pt-4 mt-2">
                      <button
                        onClick={() => setAdminVideoPage(p => Math.max(1, p - 1))}
                        disabled={adminVideoPage === 1}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <ChevronLeft className="w-3.5 h-3.5" />
                        <span>{language === 'vi' ? 'Trước' : 'Prev'}</span>
                      </button>
                      
                      <span className="text-xs font-mono text-slate-400 font-bold">
                        {language === 'vi' ? 'Trang' : 'Page'} {adminVideoPage} / {totalAdminVideoPages}
                        <span className="text-[10px] text-slate-500 ml-1.5">({filteredAdminVideos.length} videos)</span>
                      </span>

                      <button
                        onClick={() => setAdminVideoPage(p => Math.min(totalAdminVideoPages, p + 1))}
                        disabled={adminVideoPage === totalAdminVideoPages}
                        className="px-3.5 py-1.5 rounded-xl bg-slate-950 border border-slate-850 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none transition-colors flex items-center gap-1.5 text-xs font-bold cursor-pointer"
                      >
                        <span>{language === 'vi' ? 'Sau' : 'Next'}</span>
                        <ChevronRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
              )}

            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: Create/Edit Channel */}
      {isAddChannelOpen && (userRole === 'admin' || userRole === 'editor') && (
        <div id="add-channel-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                {editingChannel?.id ? 'Edit YouTube Channel' : 'Create New YouTube Channel'}
              </h3>
              <button onClick={() => setIsAddChannelOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleChannelSave} className="p-6 flex flex-col gap-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Name</label>
                  <input
                    required
                    type="text"
                    value={editingChannel?.name || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, name: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Emoji / Icon</label>
                  <input
                    type="text"
                    value={editingChannel?.emoji || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, emoji: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Tag / Category</label>
                <input
                  type="text"
                  value={editingChannel?.tag || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, tag: e.target.value })}
                  placeholder="AI & REVOLUTION"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-4 gap-3">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Subs Count</label>
                  <input
                    type="text"
                    value={editingChannel?.subscribers || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, subscribers: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Views Count</label>
                  <input
                    type="text"
                    value={editingChannel?.views || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, views: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Growth rate</label>
                  <input
                    type="text"
                    value={editingChannel?.growth || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, growth: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Start Year</label>
                  <input
                    type="text"
                    value={editingChannel?.joinedYear || ''}
                    placeholder="2023"
                    onChange={(e) => setEditingChannel({ ...editingChannel, joinedYear: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Description</label>
                <textarea
                  value={editingChannel?.description || ''}
                  onChange={(e) => setEditingChannel({ ...editingChannel, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Channel link URL</label>
                  <input
                    type="text"
                    value={editingChannel?.channelUrl || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, channelUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Subscribe URL</label>
                  <input
                    type="text"
                    value={editingChannel?.subscribeUrl || ''}
                    onChange={(e) => setEditingChannel({ ...editingChannel, subscribeUrl: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 bg-slate-950/60 p-3 rounded-xl border border-slate-850/50">
                <input
                  type="checkbox"
                  id="edit-channel-hidden"
                  checked={editingChannel?.isHidden || false}
                  onChange={(e) => setEditingChannel({ ...editingChannel, isHidden: e.target.checked })}
                  className="rounded border-slate-850 bg-slate-950 text-indigo-600 focus:ring-indigo-500 w-4 h-4 cursor-pointer"
                />
                <label htmlFor="edit-channel-hidden" className="text-xs text-slate-300 font-medium select-none cursor-pointer">
                  {language === 'vi' ? 'Ẩn kênh này khỏi trang hiển thị của người xem' : 'Hide this channel from general viewer feed'}
                </label>
              </div>

              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition-all mt-2 cursor-pointer">
                {TRANSLATIONS[language].save}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: Create/Edit Video */}
      {isAddVideoOpen && (userRole === 'admin' || userRole === 'editor') && (
        <div id="add-video-modal" className="fixed inset-0 bg-black/85 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl relative animate-in fade-in zoom-in duration-200">
            <div className="p-5 bg-slate-950 border-b border-slate-800 flex items-center justify-between">
              <h3 className="text-sm font-black uppercase tracking-wider text-slate-200">
                {editingVideo?.id ? 'Edit Publish Settings' : 'Publish New Showcase Video'}
              </h3>
              <button onClick={() => setIsAddVideoOpen(false)} className="text-slate-400 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleVideoSave} className="p-6 flex flex-col gap-4">
              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Target Channel Parent</label>
                <select
                  required
                  value={editingVideo?.channelId || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, channelId: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                >
                  <option value="">Select target channel...</option>
                  {channels.map(ch => <option key={ch.id} value={ch.id}>{ch.name}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Video Title</label>
                <input
                  required
                  type="text"
                  value={editingVideo?.title || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, title: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">YouTube Watch URL</label>
                <input
                  required
                  type="text"
                  value={editingVideo?.url || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, url: e.target.value })}
                  placeholder="https://www.youtube.com/watch?v=Ke90Tje7VS0"
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Duration</label>
                  <input
                    type="text"
                    value={editingVideo?.duration || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, duration: e.target.value })}
                    placeholder="12:44"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Video Quality</label>
                  <input
                    type="text"
                    value={editingVideo?.quality || ''}
                    onChange={(e) => setEditingVideo({ ...editingVideo, quality: e.target.value })}
                    placeholder="4K HDR"
                    className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-mono tracking-wider text-slate-500 mb-1">Description</label>
                <textarea
                  value={editingVideo?.description || ''}
                  onChange={(e) => setEditingVideo({ ...editingVideo, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-850 rounded-xl px-3 py-2 text-xs text-white outline-none resize-none"
                />
              </div>

              <div className="flex items-center gap-2 bg-slate-950/40 p-3 rounded-xl border border-slate-850">
                <input
                  id="is-live-checkbox"
                  type="checkbox"
                  checked={editingVideo?.isLive || false}
                  onChange={(e) => setEditingVideo({ ...editingVideo, isLive: e.target.checked })}
                  className="w-4 h-4 rounded border-slate-800 text-indigo-600 focus:ring-indigo-500 focus:ring-offset-slate-900 bg-slate-950 cursor-pointer"
                />
                <label htmlFor="is-live-checkbox" className="text-xs font-bold text-slate-300 cursor-pointer select-none flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse inline-block" />
                  <span>{TRANSLATIONS[language].setLiveStream}</span>
                </label>
              </div>

              <button type="submit" className="bg-indigo-600 hover:bg-indigo-500 text-white py-2 rounded-xl text-xs font-bold transition-all mt-2">
                {TRANSLATIONS[language].save}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* TOAST SYSTEM POPUP */}
      {toast && (
        <div id="system-toast" className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl border shadow-xl text-xs font-bold transition-all animate-in fade-in slide-in-from-bottom-4 ${
          toast.type === 'success' 
            ? 'bg-emerald-950 border-emerald-500/30 text-emerald-400' 
            : toast.type === 'error' 
              ? 'bg-rose-950 border-rose-500/30 text-rose-400' 
              : 'bg-slate-900 border-slate-800 text-slate-300'
        }`}>
          {toast.type === 'success' && <Check className="w-4 h-4 text-emerald-400" />}
          {toast.type === 'error' && <X className="w-4 h-4 text-rose-400" />}
          {toast.type === 'info' && <Info className="w-4 h-4 text-indigo-400" />}
          <span>{toast.message}</span>
        </div>
      )}

    </div>
  );
}
