
import axios from 'axios';

const API_URL = 'https://laoo.online/api';

const updates = [
    { id: 'cmlrjbnps001ul1pun3sn1h0b', imageUrl: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Paneer Masala Dosa
    { id: 'cmlrjbnri001wl1pupvqjm1l2', imageUrl: 'https://images.pexels.com/photos/1893501/pexels-photo-1893501.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Cheese Plain Dosa
    { id: 'cmlrjbnst001yl1puzcva214t', imageUrl: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Cheese Masala Dosa
    { id: 'cmlrjbnu90020l1pudpo2t6du', imageUrl: 'https://images.pexels.com/photos/17696431/pexels-photo-17696431/free-photo-of-close-up-of-a-rava-dosa-and-dips.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Rava Dosa
    { id: 'cmlrjbnvn0022l1pu1jt0lzwc', imageUrl: 'https://images.pexels.com/photos/17696431/pexels-photo-17696431/free-photo-of-close-up-of-a-rava-dosa-and-dips.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Rava Masala Dosa
    { id: 'cmlrjbnx00024l1puu76naq04', imageUrl: 'https://images.pexels.com/photos/17696431/pexels-photo-17696431/free-photo-of-close-up-of-a-rava-dosa-and-dips.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Rava Cheese Dosa
    { id: 'cmlrjbnyc0026l1pucwia89qx', imageUrl: 'https://images.pexels.com/photos/17696431/pexels-photo-17696431/free-photo-of-close-up-of-a-rava-dosa-and-dips.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Rava Butter Paneer Dosa
    { id: 'cmlrjbnzt0028l1puim04nv7l', imageUrl: 'https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Radhe Radhe Special Dosa
    { id: 'cmlrjbo1a002al1pu3ruqjb9r', imageUrl: 'https://images.pexels.com/photos/5410411/pexels-photo-5410411.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Sambhar Vada
    { id: 'cmlrjbo2s002cl1pupfpy4slp', imageUrl: 'https://images.pexels.com/photos/3625349/pexels-photo-3625349.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Idli Sambhar
    { id: 'cmlrjbo4d002el1pux82w1z7r', imageUrl: 'https://images.pexels.com/photos/1109197/pexels-photo-1109197.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Fry Idli
    { id: 'cmlrjbo63002gl1pumrefvalb', imageUrl: 'https://images.pexels.com/photos/12044810/pexels-photo-12044810.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Masala Uttapam
    { id: 'cmlrjbo7u002il1pu72fptle8', imageUrl: 'https://images.pexels.com/photos/12044810/pexels-photo-12044810.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Onion Uttapam
    { id: 'cmlrjbo9j002kl1puxoi9aror', imageUrl: 'https://images.pexels.com/photos/12044810/pexels-photo-12044810.jpeg?auto=compress&cs=tinysrgb&w=800' }, // Mix Uttapam
    { id: 'cmlrjbob9002ml1puyrzzsvxk', imageUrl: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg?auto=compress&cs=tinysrgb&w=800' }, // South Indian Thali
    { id: 'cmlrjbod3002ol1puaz1w9jie', imageUrl: 'https://images.pexels.com/photos/5560763/pexels-photo-5560763.jpeg?auto=compress&cs=tinysrgb&w=800' } // Schezwan Masala Dosa
];

async function updateImages() {
    for (const update of updates) {
        try {
            console.log(`Updating item ${update.id}...`);
            await axios.put(`${API_URL}/menu/items/${update.id}`, { imageUrl: update.imageUrl });
            console.log(`Successfully updated ${update.id}`);
        } catch (error: any) {
            console.error(`Failed to update ${update.id}:`, error.response?.data || error.message);
        }
    }
}

updateImages();
