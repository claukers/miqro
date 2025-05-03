export function HTMLEncode(str: string): string {
  let i = str.length;
  const aRet: string[] = [];

  while (i--) {
    const iC = str[i].charCodeAt(0);
    if (iC < 65 || iC > 127 || (iC > 90 && iC < 97)) {
      aRet[i] = '&#' + iC + ';';
    } else {
      aRet[i] = str[i];
    }
  }
  return aRet.join('');
}
