import appLogo from '../assets/app-logo.svg'

export default function BrandLogo({ size = 96, className = '', title = 'App logo' }) {
    return (
        <img
            className={className}
            src={appLogo}
            width={size}
            height={size}
            alt={title}
            loading="eager"
            decoding="async"
        />
    )
}