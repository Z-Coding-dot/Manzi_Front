/** Local illustration for listings without a photo. No external image service is required. */
export const DEFAULT_PROPERTY_PLACEHOLDER = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="800" height="600" viewBox="0 0 800 600">
<defs><linearGradient id="wall" x2="0" y2="1"><stop stop-color="#f3f0e9"/><stop offset="1" stop-color="#e5e6dc"/></linearGradient><linearGradient id="sky" x2="0" y2="1"><stop stop-color="#b9d6cc"/><stop offset="1" stop-color="#ecf2e9"/></linearGradient></defs>
<rect width="800" height="600" fill="url(#wall)"/><path d="M0 460H800V600H0z" fill="#d4c4ac"/>
<rect x="285" y="70" width="230" height="245" rx="8" fill="#fffdf7"/><rect x="299" y="84" width="202" height="217" fill="url(#sky)"/>
<path d="M299 235l60-70 54 54 38-38 50 57v63H299z" fill="#9bb5a0"/><path d="M399 84v217M299 192h202" stroke="#fffdf7" stroke-width="9"/>
<path d="M266 65v260M535 65v260" stroke="#c8bba3" stroke-width="25"/>
<rect x="220" y="303" width="360" height="133" rx="20" fill="#315e50"/><rect x="250" y="326" width="132" height="56" rx="12" fill="#fffdf7"/><rect x="418" y="326" width="132" height="56" rx="12" fill="#fffdf7"/>
<path d="M219 383h362l27 92H192z" fill="#faf8f1"/><path d="M215 407h370l15 54H200z" fill="#b6cabc"/><rect x="192" y="462" width="416" height="17" rx="6" fill="#24483d"/>
<path d="M155 465v-75M645 465v-75" stroke="#806c52" stroke-width="8"/><path d="M124 371h63v21h-63zM613 371h64v21h-64z" fill="#bba27e"/><path d="M155 350v-52M645 350v-52" stroke="#9b8666" stroke-width="5"/><path d="M136 272h38l15 27h-68zM626 272h38l15 27h-68z" fill="#f7e0aa"/>
<ellipse cx="400" cy="510" rx="245" ry="19" fill="#a6967c" opacity=".13"/>
<text x="400" y="558" text-anchor="middle" font-family="Arial,sans-serif" font-size="16" letter-spacing="3" fill="#315e50">MANZIL</text>
</svg>`)}`;
export function getPropertyImage(images?: string[] | null, index = 0): string {
  return images?.[index] || DEFAULT_PROPERTY_PLACEHOLDER;
}
