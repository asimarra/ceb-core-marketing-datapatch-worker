if (!String.prototype.formatDate) {
    String.prototype.formatDate = function ({ format = 'YYYY-MM-DD', includeHours = false, includeTimezone = false }) {
        const [date, hours, timezone] = this.split(' ')

        if ((date === null || date === undefined) && (hours === null || hours === undefined) || (timezone === null || timezone === undefined)) {
            console.warn(`The date ${date} ${hours} ${timezone} need to has the format MM/DD/YYYY HH:MI:SS Z`)
            return;
        }
        let $date = `${format}`

        if (includeHours) {
            $date = $date + ` HH:MI:SS`
        }

        if(includeTimezone){
            $date = $date + ` Z`
        }
        if (date) {
            const [month, day, year] = date.split('/')
            $date = $date.replace('YYYY', year)
            $date = $date.replace('MM', month)
            $date = $date.replace('DD',day)
        }

        if(hours && includeHours){
            $date = $date.replace('HH:MI:SS', hours)
        }

        if(timezone && includeTimezone){
            $date = $date.replace('Z', timezone)
        }

        return $date
    };
}