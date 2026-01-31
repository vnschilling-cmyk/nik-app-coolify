export const projectFonts = [
    { label: 'Standard (Quicksand)', value: 'var(--font-quicksand)', category: 'sans' },
    { label: 'Poiret One', value: 'var(--font-poiret-one)', category: 'display' },
    { label: 'Montserrat Alt', value: 'var(--font-montserrat-alternates)', category: 'sans' },
    { label: 'Jura', value: 'var(--font-jura)', category: 'sans' },
    { label: 'Sulphur Point', value: 'var(--font-sulphur-point)', category: 'sans' },
    { label: 'Gruppo', value: 'var(--font-gruppo)', category: 'display' },
    { label: 'Pompiere', value: 'var(--font-pompiere)', category: 'handwriting' },
    { label: 'Great Vibes', value: 'var(--font-great-vibes)', category: 'handwriting' },
    { label: 'Delius Swash', value: 'var(--font-delius-swash-caps)', category: 'handwriting' },
    { label: 'Tinos', value: 'var(--font-tinos)', category: 'serif' },
];

export const getFontFamily = (value: string) => {
    const font = projectFonts.find(f => f.value === value || f.label === value);
    return font ? font.value : 'var(--font-quicksand)';
};
