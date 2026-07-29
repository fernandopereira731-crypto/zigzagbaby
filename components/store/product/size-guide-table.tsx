const rows = [
  { size: 'RN', age: '0 a 1 mês', height: '48 - 52 cm', weight: 'até 4 kg' },
  { size: 'P', age: '1 a 3 meses', height: '53 - 60 cm', weight: '4 - 6 kg' },
  { size: 'M', age: '3 a 6 meses', height: '61 - 68 cm', weight: '6 - 8 kg' },
  { size: 'G', age: '6 a 9 meses', height: '69 - 74 cm', weight: '8 - 10 kg' },
  { size: '1', age: '1 ano', height: '75 - 82 cm', weight: '10 - 12 kg' },
  { size: '2', age: '2 anos', height: '83 - 92 cm', weight: '12 - 14 kg' },
  { size: '3', age: '3 anos', height: '93 - 100 cm', weight: '14 - 16 kg' },
  { size: '4', age: '4 anos', height: '101 - 108 cm', weight: '16 - 18 kg' },
]

export function SizeGuideTable() {
  return (
    <div className="overflow-hidden rounded-2xl border border-border">
      <table className="w-full border-collapse text-left text-sm">
        <thead>
          <tr className="bg-primary/10 text-foreground">
            <th className="px-4 py-3 font-bold">Tamanho</th>
            <th className="px-4 py-3 font-bold">Idade aprox.</th>
            <th className="px-4 py-3 font-bold">Altura</th>
            <th className="px-4 py-3 font-bold">Peso</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row, i) => (
            <tr
              key={row.size}
              className={i % 2 === 0 ? 'bg-card' : 'bg-muted/40'}
            >
              <td className="px-4 py-3 font-bold text-primary">{row.size}</td>
              <td className="px-4 py-3 text-foreground">{row.age}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.height}</td>
              <td className="px-4 py-3 text-muted-foreground">{row.weight}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
