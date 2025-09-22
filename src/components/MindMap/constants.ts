import { 
  Heart, Lightbulb, Target, Flag, Bookmark, Mail, Phone, Home,
  User, Calendar, Clock, MapPin, Wifi, Battery, Camera, Music,
  Smile, ThumbsUp, Coffee, Car, Plane, Gift, Bell, Settings,
  Minus, ArrowRight, CornerDownRight, MoreHorizontal, Pentagon, 
  Hexagon, Octagon, Type, MessageSquare, Triangle, Circle, Square
} from 'lucide-react';

export const colorOptions = [
  { name: 'Yellow', value: 'bg-yellow-100 border-yellow-300 text-yellow-800', bgColor: '#fef3c7', drawColor: '#f59e0b' },
  { name: 'Orange', value: 'bg-orange-100 border-orange-300 text-orange-800', bgColor: '#fed7aa', drawColor: '#ea580c' },
  { name: 'Green Light', value: 'bg-lime-100 border-lime-300 text-lime-800', bgColor: '#d9f99d', drawColor: '#65a30d' },
  { name: 'Green', value: 'bg-green-100 border-green-300 text-green-800', bgColor: '#dcfce7', drawColor: '#16a34a' },
  { name: 'Blue Light', value: 'bg-cyan-100 border-cyan-300 text-cyan-800', bgColor: '#cffafe', drawColor: '#0891b2' },
  { name: 'Blue', value: 'bg-blue-100 border-blue-300 text-blue-800', bgColor: '#dbeafe', drawColor: '#2563eb' },
  { name: 'Purple Light', value: 'bg-purple-100 border-purple-300 text-purple-800', bgColor: '#e9d5ff', drawColor: '#9333ea' },
  { name: 'Pink', value: 'bg-pink-100 border-pink-300 text-pink-800', bgColor: '#fce7f3', drawColor: '#ec4899' },
  { name: 'Rose', value: 'bg-rose-100 border-rose-300 text-rose-800', bgColor: '#ffe4e6', drawColor: '#f43f5e' },
  { name: 'White', value: 'bg-white border-gray-300 text-gray-800', bgColor: '#ffffff', drawColor: '#6b7280' },
  { name: 'Gray', value: 'bg-gray-100 border-gray-300 text-gray-800', bgColor: '#f3f4f6', drawColor: '#4b5563' },
  { name: 'Black', value: 'bg-gray-800 border-gray-700 text-white', bgColor: '#1f2937', drawColor: '#111827' }
];

export const drawingColors = [
  { name: 'Black', color: '#000000' },
  { name: 'Dark Gray', color: '#374151' },
  { name: 'Red', color: '#ef4444' },
  { name: 'Orange', color: '#f97316' },
  { name: 'Yellow', color: '#eab308' },
  { name: 'Green', color: '#22c55e' },
  { name: 'Blue', color: '#3b82f6' },
  { name: 'Purple', color: '#8b5cf6' },
  { name: 'Pink', color: '#ec4899' },
  { name: 'Brown', color: '#a3692e' }
];

export const textTypes = {
  heading: { label: 'Heading', style: 'text-lg font-semibold', icon: Type },
  body: { label: 'Paragraph', style: 'text-sm', icon: MessageSquare },
  comment: { label: 'Comment', style: 'text-xs italic text-muted-foreground', icon: MessageSquare }
};

export const connectionTypes = [
  { type: 'straight', label: 'Straight', icon: Minus },
  { type: 'curved', label: 'Curved', icon: CornerDownRight },
  { type: 'elbow', label: 'Elbow', icon: ArrowRight },
  { type: 'dotted', label: 'Dotted', icon: MoreHorizontal }
];

export const shapeTypes = [
  { shape: 'line', label: 'Line', icon: Minus },
  { shape: 'circle', label: 'Circle', icon: Circle },
  { shape: 'rectangle', label: 'Rectangle', icon: Square },
  { shape: 'triangle', label: 'Triangle', icon: Triangle },
  { shape: 'pentagon', label: 'Pentagon', icon: Pentagon },
  { shape: 'hexagon', label: 'Hexagon', icon: Hexagon },
  { shape: 'octagon', label: 'Octagon', icon: Octagon }
];

export const iconOptions = [
  { name: 'heart', icon: Heart },
  { name: 'lightbulb', icon: Lightbulb },
  { name: 'target', icon: Target },
  { name: 'flag', icon: Flag },
  { name: 'bookmark', icon: Bookmark },
  { name: 'mail', icon: Mail },
  { name: 'phone', icon: Phone },
  { name: 'home', icon: Home },
  { name: 'user', icon: User },
  { name: 'calendar', icon: Calendar },
  { name: 'clock', icon: Clock },
  { name: 'map-pin', icon: MapPin },
  { name: 'wifi', icon: Wifi },
  { name: 'battery', icon: Battery },
  { name: 'camera', icon: Camera },
  { name: 'music', icon: Music },
  { name: 'smile', icon: Smile },
  { name: 'thumbs-up', icon: ThumbsUp },
  { name: 'coffee', icon: Coffee },
  { name: 'car', icon: Car },
  { name: 'plane', icon: Plane },
  { name: 'gift', icon: Gift },
  { name: 'bell', icon: Bell },
  { name: 'settings', icon: Settings }
];